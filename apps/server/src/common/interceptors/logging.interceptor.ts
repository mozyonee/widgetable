import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { formatTime } from '@widgetable/types';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
	private readonly logger = new Logger('HTTP');

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const req = context.switchToHttp().getRequest();
		const { method, url } = req;
		const now = Date.now();

		this.logger.log(`--> ${method} ${url} started`);

		return next.handle().pipe(
			tap(() => {
				this.logger.log(`<-- ${method} ${url} completed in ${formatTime(Date.now() - now)}`);
			}),
		);
	}
}
