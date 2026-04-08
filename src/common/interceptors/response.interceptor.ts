import { CallHandler, ConsoleLogger, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';


@Injectable()
export class ResponseInterceptor implements NestInterceptor {
    private readonly logger = new ConsoleLogger(ResponseInterceptor.name)

    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest<Request>()
        const { method, url } = request

        this.logger.log({
            method,
            url
        })

        return next.handle().pipe(
            map(data => ({
                success: true,
                data
            })),
        )
    }

}