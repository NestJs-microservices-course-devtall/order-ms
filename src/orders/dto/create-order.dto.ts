import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, ValidateNested } from "class-validator";
import { OrderItemDto } from "./order-item.dto";
export class CreateOrderDto {


  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each:true })
  @Type(() => OrderItemDto)
  items!: any[]

  // @IsNumber()
  // @IsPositive()
  // totalAmount!:number;

  // @IsNumber()
  // @IsPositive()
  // totalItems!: number;

  // @IsEnum( OrderStatus, {
  //   message: `Possible status value are ${ OrderStatusList }`
  // })
  // @IsOptional()
  // status: OrderStatus = OrderStatus.PENDING


  // @IsBoolean()
  // @IsOptional()
  // paid: boolean = false

}
