from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.chat import ChatSession, Message
from app.models.document import Document, DocumentStatus
from app.models.user import User
from app.schemas.chat import (
    ChatSessionCreate,
    ChatSessionListResponse,
    ChatSessionResponse,
    ChatSessionUpdate,
    ConfidenceInfo,
    MessageCreate,
    MessageResponse,
)
from app.services.rag import generate_answer, retrieve_context, stream_answer

router = APIRouter()


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _pretty_filename(name: str) -> str:
    if name.lower().endswith(".pdf"):
        return name[:-4]
    return name


def _title_from_documents(document_ids: list[str], db: Session) -> str:
    if not document_ids:
        return "New Chat"
    rows = (
        db.query(Document.original_filename)
        .filter(Document.id.in_(document_ids))
        .all()
    )
    names = [_pretty_filename(r[0]) for r in rows]
    if not names:
        return "New Chat"
    if len(names) == 1:
        return names[0]
    return f"{names[0]} + {len(names) - 1} more"


def _session_to_response(session: ChatSession, db: Session, *, include_messages: bool = False) -> ChatSessionResponse:
    doc_names: list[str] = []
    if session.document_ids:
        rows = (
            db.query(Document.original_filename)
            .filter(Document.id.in_(session.document_ids))
            .all()
        )
        doc_names = [r[0] for r in rows]

    last_msg = (
        db.query(Message)
        .filter(Message.session_id == session.id)
        .order_by(Message.created_at.desc())
        .first()
    )

    last_preview = None
    last_at = None
    if last_msg:
        last_at = last_msg.created_at
        text = last_msg.content.strip()
        last_preview = text[:72] + ("…" if len(text) > 72 else "")

    messages: list[MessageResponse] = []
    if include_messages:
        msgs = (
            db.query(Message)
            .filter(Message.session_id == session.id)
            .order_by(Message.created_at)
            .all()
        )
        messages = [_message_to_response(m) for m in msgs]

    return ChatSessionResponse(
        id=session.id,
        title=session.title,
        document_ids=session.document_ids or [],
        document_names=doc_names,
        last_message_preview=last_preview,
        last_message_at=last_at,
        created_at=session.created_at,
        updated_at=session.updated_at,
        messages=messages,
    )


def _message_to_response(msg: Message) -> MessageResponse:
    confidence = None
    if msg.confidence:
        confidence = ConfidenceInfo(**msg.confidence)
    return MessageResponse(
        id=msg.id,
        role=msg.role,
        content=msg.content,
        citations=msg.citations,
        confidence=confidence,
        created_at=msg.created_at,
    )


def _get_session(session_id: str, user_id: str, db: Session) -> ChatSession:
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == user_id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return session


def _validate_documents(user_id: str, document_ids: list[str], db: Session) -> None:
    if not document_ids:
        return
    ready_docs = (
        db.query(Document)
        .filter(
            Document.user_id == user_id,
            Document.id.in_(document_ids),
            Document.status == DocumentStatus.READY,
        )
        .count()
    )
    if ready_docs != len(document_ids):
        raise HTTPException(
            status_code=400,
            detail="All selected documents must exist and be fully processed",
        )


@router.post("/sessions", response_model=ChatSessionResponse, status_code=status.HTTP_201_CREATED)
def create_session(
    payload: ChatSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _validate_documents(current_user.id, payload.document_ids, db)
    title = payload.title or "New Chat"
    if title == "New Chat" and payload.document_ids:
        title = _title_from_documents(payload.document_ids, db)
    session = ChatSession(
        user_id=current_user.id,
        title=title,
        document_ids=payload.document_ids,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return _session_to_response(session, db)


@router.get("/sessions", response_model=ChatSessionListResponse)
def list_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.updated_at.desc())
        .all()
    )
    return ChatSessionListResponse(
        sessions=[_session_to_response(s, db) for s in sessions],
        total=len(sessions),
    )


@router.get("/sessions/{session_id}", response_model=ChatSessionResponse)
def get_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = _get_session(session_id, current_user.id, db)
    return _session_to_response(session, db, include_messages=True)


@router.patch("/sessions/{session_id}", response_model=ChatSessionResponse)
def update_session(
    session_id: str,
    payload: ChatSessionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = _get_session(session_id, current_user.id, db)
    if payload.title is not None:
        session.title = payload.title
    if payload.document_ids is not None:
        _validate_documents(current_user.id, payload.document_ids, db)
        session.document_ids = payload.document_ids
    db.commit()
    db.refresh(session)
    return _session_to_response(session, db, include_messages=True)


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = _get_session(session_id, current_user.id, db)
    db.delete(session)
    db.commit()


@router.post("/sessions/{session_id}/messages", response_model=MessageResponse)
async def send_message(
    session_id: str,
    payload: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = _get_session(session_id, current_user.id, db)
    document_ids = session.document_ids or None

    if not document_ids:
        raise HTTPException(status_code=400, detail="Select at least one processed document for this chat")

    user_msg = Message(session_id=session.id, role="user", content=payload.content)
    db.add(user_msg)
    session.updated_at = _utcnow()
    db.commit()

    history = [
        {"role": m.role, "content": m.content}
        for m in db.query(Message).filter(Message.session_id == session.id).order_by(Message.created_at).all()
    ]

    chunks = retrieve_context(current_user.id, payload.content, document_ids)
    rag = generate_answer(payload.content, chunks, history)

    assistant_msg = Message(
        session_id=session.id,
        role="assistant",
        content=rag.answer,
        citations=[c.model_dump() for c in rag.citations],
        confidence=rag.confidence.to_dict(),
    )
    db.add(assistant_msg)
    session.updated_at = _utcnow()
    db.commit()
    db.refresh(assistant_msg)
    return _message_to_response(assistant_msg)


@router.post("/sessions/{session_id}/messages/stream")
async def send_message_stream(
    session_id: str,
    payload: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = _get_session(session_id, current_user.id, db)
    document_ids = session.document_ids or None

    if not document_ids:
        raise HTTPException(status_code=400, detail="Select at least one processed document for this chat")

    user_msg = Message(session_id=session.id, role="user", content=payload.content)
    db.add(user_msg)
    session.updated_at = _utcnow()
    db.commit()

    history = [
        {"role": m.role, "content": m.content}
        for m in db.query(Message).filter(Message.session_id == session.id).order_by(Message.created_at).all()
    ]

    chunks = retrieve_context(current_user.id, payload.content, document_ids)

    import json
    from app.database import SessionLocal

    sid = session.id

    async def event_stream():
        full_parts: list[str] = []
        citations_data = None
        confidence_data = None
        async for event in stream_answer(payload.content, chunks, history):
            yield event
            if event.startswith("data: ") and event.strip() != "data: [DONE]":
                try:
                    data = json.loads(event[6:].strip())
                    if data.get("type") == "token":
                        full_parts.append(data.get("content", ""))
                    elif data.get("type") == "citations":
                        citations_data = data.get("citations")
                    elif data.get("type") == "confidence":
                        confidence_data = {
                            k: data[k]
                            for k in (
                                "confidence_score",
                                "confidence_level",
                                "insufficient_context",
                                "max_similarity",
                                "avg_similarity",
                            )
                            if k in data
                        }
                except json.JSONDecodeError:
                    pass

        answer = "".join(full_parts)
        persist = SessionLocal()
        try:
            sess = persist.query(ChatSession).filter(ChatSession.id == sid).first()
            assistant_msg = Message(
                session_id=sid,
                role="assistant",
                content=answer,
                citations=citations_data,
                confidence=confidence_data,
            )
            persist.add(assistant_msg)
            if sess:
                sess.updated_at = _utcnow()
            persist.commit()
        finally:
            persist.close()

    return StreamingResponse(event_stream(), media_type="text/event-stream")
