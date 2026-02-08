import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Request, RequestSchema } from './entities/request.entity';
import { RequestsService } from './requests.service';

@Module({
	imports: [MongooseModule.forFeature([{ name: Request.name, schema: RequestSchema }])],
	providers: [RequestsService],
	exports: [RequestsService],
})
export class RequestsModule {}
