from fastapi import APIRouter, Depends
from pydantic import BaseModel

from core.deps import get_current_user
from models.user_model import UserDB

router = APIRouter(prefix="/api/support", tags=["Support"])


class SupportTicketRequest(BaseModel):
    category: str
    platform: str
    subject: str
    details: str


@router.post("/ticket", status_code=201)
def submit_ticket(
    body: SupportTicketRequest,
    current_user: UserDB = Depends(get_current_user),
) -> dict:
    # En producción: guardar en DB o enviar email. Por ahora solo confirma recepción.
    return {"message": "Ticket recibido", "email": current_user.email}
