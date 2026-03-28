from fastapi import Depends, HTTPException, Request

def require_user_types(allowed_types: list[str]):
    def checker(request: Request):
        user_type = getattr(request.state, "user_type", None)

        if user_type not in allowed_types:
            raise HTTPException(
                status_code=403,
                detail=f"Access denied for user type: {user_type}"
            )
        return request.state.user

    return checker