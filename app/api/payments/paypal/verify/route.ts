import { NextRequest, NextResponse } from "next/server";
import { checkRole } from "@/lib/utils/auth";
import axios from "axios";

// Constants for PayPal API
const PAYPAL_API_SANDBOX = "https://api-m.sandbox.paypal.com";
const PAYPAL_API_PRODUCTION = "https://api-m.paypal.com";
const PAYPAL_API_BASE = process.env.NODE_ENV === "production" 
  ? PAYPAL_API_PRODUCTION 
  : PAYPAL_API_SANDBOX;

export async function POST(req: NextRequest) {
  try {
    const session = await checkRole(
      "USER",
      "You are not authorized for this action"
    );

    // Parse request body
    const body = await req.json();
    const { orderId } = body;
    
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Missing order ID" },
        { status: 400 }
      );
    }
    
    try {
      // Get PayPal access token
      const accessToken = await getPayPalAccessToken();
      
      // Verify the order with PayPal
      const orderDetails = await verifyPayPalOrder(orderId, accessToken);
      
      // Check if the payment is completed
      const isValid = orderDetails.status === 'COMPLETED' || orderDetails.status === 'APPROVED';
      
      if (isValid) {
        return NextResponse.json({
          success: true,
          message: "Payment verified successfully",
          orderId,
          details: orderDetails
        });
      } else {
        return NextResponse.json({
          success: false,
          message: `Payment verification failed. Status: ${orderDetails.status}`,
          orderId
        }, { status: 400 });
      }
    } catch (error) {
      console.error("PayPal API error:", error);
      return NextResponse.json({
        success: false, 
        error: "Failed to verify payment with PayPal",
        details: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Error verifying PayPal payment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}

// Get PayPal OAuth access token
async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID || "YOUR_SANDBOX_CLIENT_ID";
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET || "YOUR_SANDBOX_SECRET";
  
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  try {
    const response = await axios.post(
      `${PAYPAL_API_BASE}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    return response.data.access_token;
  } catch (error) {
    console.error("Error getting PayPal access token:", error);
    throw new Error("Failed to get PayPal access token");
  }
}

// Verify PayPal order status
async function verifyPayPalOrder(orderId: string, accessToken: string) {
  try {
    const response = await axios.get(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error("Error verifying PayPal order:", error);
    throw new Error("Failed to verify PayPal order");
  }
}