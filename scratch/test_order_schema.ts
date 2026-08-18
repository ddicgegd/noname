import { 
  GraphQLSchema, 
  GraphQLObjectType, 
  GraphQLInputObjectType,
  GraphQLFloat,
  GraphQLString, 
  GraphQLInt, 
  GraphQLList,
  GraphQLNonNull,
  graphql
} from "graphql";

const StatusType = new GraphQLObjectType({
  name: "Status",
  fields: {
    code: { type: GraphQLInt },
    message: { type: GraphQLString },
  }
});

const CreateOrderItemInputType = new GraphQLInputObjectType({
  name: "CreateOrderItemInput",
  fields: {
    attributesSku: { type: new GraphQLNonNull(GraphQLString) },
    quantity: { type: new GraphQLNonNull(GraphQLInt) }
  }
});

const CreateOrderInputType = new GraphQLInputObjectType({
  name: "CreateOrderInput",
  fields: {
    items: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(CreateOrderItemInputType))) },
    addressSku: { type: new GraphQLNonNull(GraphQLString) },
    paymentMethod: { type: GraphQLString }
  }
});

const OrderVariantOptionType = new GraphQLObjectType({
  name: "OrderVariantOption",
  fields: {
    name: { type: GraphQLString },
    value: { type: GraphQLString }
  }
});

const OrderItemType = new GraphQLObjectType({
  name: "OrderItemDto",
  fields: {
    attributesSku: { type: GraphQLString },
    quantity: { type: GraphQLInt },
    unitPrice: { type: GraphQLFloat },
    salePrice: { type: GraphQLFloat },
    subtotal: { type: GraphQLFloat },
    variantOptions: { type: new GraphQLList(OrderVariantOptionType) }
  }
});

const OrderType = new GraphQLObjectType({
  name: "OrderDto",
  fields: {
    orderNumber: { type: GraphQLString },
    currentStatus: { type: GraphQLString },
    shippingAddress: { type: GraphQLString },
    subtotal: { type: GraphQLFloat },
    totalAmount: { type: GraphQLFloat },
    orderItems: { type: new GraphQLList(OrderItemType) }
  }
});

const CreateOrderResponseType = new GraphQLObjectType({
  name: "CreateOrderResponse",
  fields: {
    status: { type: StatusType },
    data: { type: OrderType }
  }
});

const mapOrderData = (data: any) => {
  if (!data) return null;
  const { id: _orderId, ...orderWithoutId } = data;
  const rawItems = orderWithoutId.orderItems || orderWithoutId.items || [];
  const orderItems = rawItems.map((item: any) => {
    const { id: _iId, orderId: _oId, ...itemWithoutIds } = item;
    return itemWithoutIds;
  });
  return {
    ...orderWithoutId,
    orderItems
  };
};

const RootMutation = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    createOrder: {
      type: CreateOrderResponseType,
      args: {
        input: { type: new GraphQLNonNull(CreateOrderInputType) }
      },
      resolve: async (_, args) => {
        const mockRaw = {
          id: 99999, // to be stripped
          orderNumber: "018d9ef2-5b94-7123-88bb-abcdef123456",
          currentStatus: "PENDING",
          shippingAddress: "123 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
          subtotal: 21990000.0,
          totalAmount: 22239900.0,
          orderItems: [
            {
              id: 101, // to be stripped
              orderId: 99999, // to be stripped
              attributesSku: "SKU-IPHONE15-128GB-BLK",
              quantity: 1,
              unitPrice: 22990000.0,
              salePrice: 21990000.0,
              subtotal: 21990000.0,
              variantOptions: [
                {
                  name: "Màu sắc",
                  value: "Đen"
                }
              ]
            }
          ]
        };

        return {
          status: {
            code: 201,
            message: "Order created successfully"
          },
          data: mapOrderData(mockRaw)
        };
      }
    }
  }
});

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: "Query",
    fields: {
      dummy: { type: GraphQLString, resolve: () => "ok" }
    }
  }),
  mutation: RootMutation
});

async function runTest() {
  const query = `
    mutation CreateOrder($input: CreateOrderInput!) {
      createOrder(input: $input) {
        status {
          code
          message
        }
        data {
          orderNumber
          currentStatus
          shippingAddress
          subtotal
          totalAmount
          orderItems {
            attributesSku
            quantity
            unitPrice
            salePrice
            subtotal
            variantOptions {
              name
              value
            }
          }
        }
      }
    }
  `;

  const variables = {
    input: {
      items: [
        {
          attributesSku: "SKU-IPHONE15-128GB-BLK",
          quantity: 1
        }
      ],
      addressSku: "ADDR-018D9EF25B94",
      paymentMethod: "COD"
    }
  };

  const res = await graphql({ schema, source: query, variableValues: variables });
  console.log(JSON.stringify(res, null, 2));
}

runTest();
