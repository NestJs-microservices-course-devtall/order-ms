import { HttpStatus, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaClient } from 'generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { OrderPaginationDto } from './dto/order-paginatio.dto';
import { ChangeOrderStatusDto } from './dto/change-order-status.dto';
import { NATS_SERVICE } from 'src/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit{

  private readonly logger = new Logger('OrderServices')

  constructor(
    @Inject(NATS_SERVICE) private readonly client: ClientProxy,

  ) {
    super({
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    });
  }

  async create(createOrderDto: CreateOrderDto) {
    
    try {

      const productsIds = createOrderDto.items.map( item => item.productId )

      const products: any[] =  await firstValueFrom( this.client.send({ cmd: "validate_product"}, productsIds) )
      
      //  calculo de los valores 
      const totalAmount = createOrderDto.items.reduce( ( acc, orderItem ) => {

        const price = products.find( product =>  product.id === orderItem.productId).price

        return price * orderItem.quantity

      },0)

      const totalItems = createOrderDto.items.reduce( (acc, orderItem) => {
        return acc + orderItem.quantity
      },0)

      const order = await  this.order.create({
        data:{
          totalAmount:totalAmount,
          totalItems: totalItems,
          OrderItem: {
            createMany:{
              data: createOrderDto.items.map( ( orderItem ) => ({
                price: products.find( product =>  product.id === orderItem.productId).price,
                productId: orderItem.productId,
                quantity: orderItem.quantity
              }))

            }
          }
        },
        include:{
          OrderItem: {
            select:{
              price:true,
              quantity: true,
              productId: true 
            }
          }
        }
      })

      return {
        ...order,
        OrderItem: order.OrderItem.map( (orderItem)=> ({
          ...orderItem,
          name: products.find((product)=>  product.id === orderItem.productId).name
        }))
      }

    } catch (error) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message:"Check logs"
      })


    }
  }

  async findAll( orderPaginationDto: OrderPaginationDto) {

    const totalPages = await this.order.count({
      where:{
        status: orderPaginationDto.status
      }
    })

    const currentPage =orderPaginationDto.page!;
    const perPage = orderPaginationDto.limit!;

    return {
      data: await this.order.findMany({
        skip:( currentPage - 1 ) * perPage,
        take: perPage,
        where :{
          status: orderPaginationDto.status
        }
      }),
      meta:{ 
        total: totalPages,
        page: currentPage,
        lastPage: Math.ceil( totalPages / perPage)
      }
    }
  }

  async findOne(id:string) {
    const order = await this.order.findFirst({
      where:{ id },
      include: {
        OrderItem:{
          select:{
            price: true, 
            quantity: true,
            productId: true,
          }
        }
      }
    })

    if( !order ) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `order with id ${ id } not found `
      })
    }

    const productsId =  order.OrderItem.map( orderItem => orderItem.productId)
      const products: any[] =  await firstValueFrom( this.client.send({ cmd: "validate_product"}, productsId) )

    return {
      ...order,
      OrderItem: order.OrderItem.map( (orderItem)=> ({
        ...orderItem,
        name: products.find( (product) =>product.id === orderItem.productId  ).name
      }))
    }
  }

  update(id: number, updateOrderDto: UpdateOrderDto) {
    return `This action updates a #${id} order`;
  }

  remove(id: number) {
    return `This action removes a #${id} order`;
  }

  async changeStatus( changeOrderStatus: ChangeOrderStatusDto)
  {
    const { id, status } = changeOrderStatus
    const order = await this.findOne(id)
  
    return this.order.update({
      where:  {id},
      data: { status:status}}
    )
  }

  async onModuleInit() {
    await this.$connect()
    this.logger.log('Base de datos conectada ✌🏽')
  }
}
