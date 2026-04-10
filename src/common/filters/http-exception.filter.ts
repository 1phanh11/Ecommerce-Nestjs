import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { Request, Response } from "express";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name)

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR as number
        let message = 'Internal server error. Please try again later'
        let code = 'INTERNAL_ERROR'

        if (exception instanceof HttpException) {
            status = exception.getStatus()
            const res = exception.getResponse() as any
            message = typeof res === 'string' ? res : res.message
            code = exception.name.replace('Exception', '').toUpperCase();
        }

        
        this.logger.error("\n" + JSON.stringify({
            success: false,
            error: {
                message,
                code,
            }
        }, null, 2))



        response.status(status).json({
            success: false,
            error: {
                message,
                code,
            }
        })
    }

}