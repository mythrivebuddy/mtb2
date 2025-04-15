import React from "react";
import { Star } from "lucide-react";

interface Order {
  id: string;
  item:
    | {
        name: string;
        basePrice: number;
        monthlyPrice: number;
        yearlyPrice: number;
        lifetimePrice: number;
        imageUrl: string;
      }
    | undefined; // Allow item to be undefined
  status: string;
  purchasedAt: string;
}

interface OrdersSectionProps {
  orders: Order[];
  getPriceForMembership: (item: Order["item"]) => number;
}

const OrdersSection: React.FC<OrdersSectionProps> = ({ orders, getPriceForMembership }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "text-green-600";
      case "shipped":
        return "text-blue-600";
      case "processing":
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
  };

  // Debugging: Log orders to inspect the data
  console.log("Orders data in OrderSection:", orders);

  return (
    <div className="bg-white shadow rounded-xl p-6">
      <h3 className="text-xl font-bold mb-4 flex items-center">
        <Star className="w-5 h-5 mr-2 text-yellow-500" />
        My Orders
      </h3>
      {orders.length === 0 ? (
        <p className="text-gray-500">No orders found.</p>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.id} className="flex items-center space-x-4 border-b pb-2">
              {order.item ? (
                <>
                  <img
                    src={order.item.imageUrl}
                    alt={order.item.name}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                  <div className="flex-1">
                    <span className="text-gray-800 font-semibold">{order.item.name}</span>
                    <p className="text-sm text-gray-500">
                      Ordered: {new Date(order.purchasedAt).toLocaleDateString()}
                    </p>
                    <p className={`text-sm font-medium ${getStatusColor(order.status)}`}>
                      Status: {order.status}
                    </p>
                  </div>
                  <span className="text-green-600 font-semibold">
                    ${Number(getPriceForMembership(order.item)).toFixed(2)}
                  </span>
                </>
              ) : (
                <div className="flex-1 text-red-600">Error: Order item data is missing</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default OrdersSection;