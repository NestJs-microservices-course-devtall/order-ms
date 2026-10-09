
import { Catch, ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

@Catch(RpcException)
export class RpcCustomExceptionFilter implements ExceptionFilter {
  catch(exception: RpcException, host: ArgumentsHost) {
    
    const ctx = host.switchToHttp()
    const response = ctx.getResponse();


    const rpcError = exception.getError();
    if( typeof rpcError === 'object' &&  rpcError !== null && 'status' in rpcError && 'message' in rpcError ){
      const error = rpcError as { status: string | number; message: string };
      const status = isNaN( +error.status ) ? 400 : +error.status;
      return response.status(status).json(error)
    }

    response.status(400).json({
      status:400,
      message:rpcError
    })



  }
}
