import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRequest } from 'src/users/entities/user.entity';

export const GetUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
	const request: UserRequest = ctx.switchToHttp().getRequest();
	return request.user;
});
