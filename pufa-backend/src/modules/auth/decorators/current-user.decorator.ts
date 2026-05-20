import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Extrae el usuario autenticado del request (poblado por JwtStrategy)
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
