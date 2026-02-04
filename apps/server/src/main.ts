import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import * as cors from 'cors';
import mongoose from 'mongoose';
import { AppModule } from './app.module';
import { LoggingInterceptor } from 'src/common/interceptors/logging.interceptor';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	app.use(cookieParser());

	app.use(
		cors({
			origin: (origin, callback) => {
				if (!origin) return callback(null, true);

				let hostname: string;

				try {
					hostname = new URL(origin).hostname;
				} catch {
					return callback(new Error('Invalid origin'));
				}

				const isLocal =
					hostname === 'myapp.test' ||
					hostname === 'localhost' ||
					hostname === '127.0.0.1' ||
					hostname.startsWith('192.168.') ||
					hostname.startsWith('10.') ||
					(hostname.startsWith('172.') &&
						(() => {
							const secondOctet = Number(hostname.split('.')[1]);
							return secondOctet >= 16 && secondOctet <= 31;
						})());

				if (isLocal) {
					callback(null, true);
				} else {
					callback(new Error(`${origin} Not allowed by CORS`));
				}
			},
			credentials: true,
		}),
	);

	app.useGlobalPipes(new ValidationPipe());

	if (process.env.NODE_ENV !== 'production') {
		mongoose.set('debug', true);
	}

	app.useGlobalInterceptors(new LoggingInterceptor());

	app.enableShutdownHooks();

	await app.listen(process.env.PORT ?? 3001, '0.0.0.0');
}

bootstrap();
