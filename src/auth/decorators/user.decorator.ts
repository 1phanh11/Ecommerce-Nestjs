import { createParamDecorator, ExecutionContext, SetMetadata } from "@nestjs/common";

export const GetUser = createParamDecorator((
    data: string | undefined, context: ExecutionContext
) => {
    const request = context.switchToHttp().getRequest()
    const user = request.user;

    return data ? user?.[data] : user
})

export const Public = () => SetMetadata('IS_PUBLIC', true)