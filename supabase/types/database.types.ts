export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      Advertisement: {
        Row: {
          badge: string | null
          createdAt: string
          description: string
          discountTag: string | null
          id: string
          image: string
          isActive: boolean
          linkText: string | null
          linkUrl: string | null
          title: string
          updatedAt: string
        }
        Insert: {
          badge?: string | null
          createdAt?: string
          description: string
          discountTag?: string | null
          id: string
          image: string
          isActive?: boolean
          linkText?: string | null
          linkUrl?: string | null
          title: string
          updatedAt: string
        }
        Update: {
          badge?: string | null
          createdAt?: string
          description?: string
          discountTag?: string | null
          id?: string
          image?: string
          isActive?: boolean
          linkText?: string | null
          linkUrl?: string | null
          title?: string
          updatedAt?: string
        }
        Relationships: []
      }
      Announcement: {
        Row: {
          createdAt: string
          description: string
          id: string
          isPublished: boolean
          title: string
          type: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          description: string
          id: string
          isPublished?: boolean
          title: string
          type?: string
          updatedAt: string
        }
        Update: {
          createdAt?: string
          description?: string
          id?: string
          isPublished?: boolean
          title?: string
          type?: string
          updatedAt?: string
        }
        Relationships: []
      }
      BuyerReport: {
        Row: {
          adminNotes: string | null
          buyerId: string
          createdAt: string
          details: string
          id: string
          orderId: string | null
          orderNumber: string | null
          reason: string
          sellerId: string
          status: Database["public"]["Enums"]["ReportStatus"]
        }
        Insert: {
          adminNotes?: string | null
          buyerId: string
          createdAt?: string
          details: string
          id: string
          orderId?: string | null
          orderNumber?: string | null
          reason: string
          sellerId: string
          status?: Database["public"]["Enums"]["ReportStatus"]
        }
        Update: {
          adminNotes?: string | null
          buyerId?: string
          createdAt?: string
          details?: string
          id?: string
          orderId?: string | null
          orderNumber?: string | null
          reason?: string
          sellerId?: string
          status?: Database["public"]["Enums"]["ReportStatus"]
        }
        Relationships: [
          {
            foreignKeyName: "BuyerReport_buyerId_fkey"
            columns: ["buyerId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "BuyerReport_orderId_fkey"
            columns: ["orderId"]
            isOneToOne: false
            referencedRelation: "Order"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "BuyerReport_sellerId_fkey"
            columns: ["sellerId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Cart: {
        Row: {
          id: string
          updatedAt: string
          userId: string
        }
        Insert: {
          id: string
          updatedAt: string
          userId: string
        }
        Update: {
          id?: string
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Cart_userId_fkey"
            columns: ["userId"]
            isOneToOne: true
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      CartItem: {
        Row: {
          cartId: string
          id: string
          productId: string
          quantity: number
          selectedColor: string | null
          selectedSize: string | null
          selectedVariation: string | null
        }
        Insert: {
          cartId: string
          id: string
          productId: string
          quantity: number
          selectedColor?: string | null
          selectedSize?: string | null
          selectedVariation?: string | null
        }
        Update: {
          cartId?: string
          id?: string
          productId?: string
          quantity?: number
          selectedColor?: string | null
          selectedSize?: string | null
          selectedVariation?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "CartItem_cartId_fkey"
            columns: ["cartId"]
            isOneToOne: false
            referencedRelation: "Cart"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "CartItem_productId_fkey"
            columns: ["productId"]
            isOneToOne: false
            referencedRelation: "Product"
            referencedColumns: ["id"]
          },
        ]
      }
      Category: {
        Row: {
          createdAt: string
          description: string | null
          hausaName: string | null
          iconName: string
          id: string
          image: string
          name: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          description?: string | null
          hausaName?: string | null
          iconName?: string
          id: string
          image?: string
          name: string
          updatedAt: string
        }
        Update: {
          createdAt?: string
          description?: string | null
          hausaName?: string | null
          iconName?: string
          id?: string
          image?: string
          name?: string
          updatedAt?: string
        }
        Relationships: []
      }
      FlashSale: {
        Row: {
          bannerImage: string | null
          createdAt: string
          description: string | null
          discountPercentage: number
          endTime: string
          id: string
          isActive: boolean
          startTime: string
          title: string
        }
        Insert: {
          bannerImage?: string | null
          createdAt?: string
          description?: string | null
          discountPercentage: number
          endTime: string
          id: string
          isActive?: boolean
          startTime: string
          title: string
        }
        Update: {
          bannerImage?: string | null
          createdAt?: string
          description?: string | null
          discountPercentage?: number
          endTime?: string
          id?: string
          isActive?: boolean
          startTime?: string
          title?: string
        }
        Relationships: []
      }
      FlashSaleProduct: {
        Row: {
          flashSaleId: string
          productId: string
        }
        Insert: {
          flashSaleId: string
          productId: string
        }
        Update: {
          flashSaleId?: string
          productId?: string
        }
        Relationships: [
          {
            foreignKeyName: "FlashSaleProduct_flashSaleId_fkey"
            columns: ["flashSaleId"]
            isOneToOne: false
            referencedRelation: "FlashSale"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "FlashSaleProduct_productId_fkey"
            columns: ["productId"]
            isOneToOne: false
            referencedRelation: "Product"
            referencedColumns: ["id"]
          },
        ]
      }
      NewsletterSubscription: {
        Row: {
          createdAt: string
          email: string
          id: string
        }
        Insert: {
          createdAt?: string
          email: string
          id: string
        }
        Update: {
          createdAt?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      Order: {
        Row: {
          adminRejectionReason: string | null
          buyerEmail: string
          buyerId: string
          buyerName: string
          buyerPhone: string
          createdAt: string
          deliveredAt: string | null
          deliveryFee: number
          dispatchedAt: string | null
          id: string
          logisticsCompanyName: string | null
          logisticsStatus: string | null
          orderNumber: string
          paymentConfirmation: Json
          paymentMethod: Database["public"]["Enums"]["PaymentMethod"]
          sellerBusinessName: string
          sellerId: string | null
          sellerName: string
          sellerPhone: string
          sellerRejectionReason: string | null
          sellerWhatsApp: string
          shippingAddress: Json
          status: Database["public"]["Enums"]["OrderStatus"]
          subtotal: number
          totalAmount: number
          trackingNumber: string | null
          updatedAt: string
        }
        Insert: {
          adminRejectionReason?: string | null
          buyerEmail: string
          buyerId: string
          buyerName: string
          buyerPhone: string
          createdAt?: string
          deliveredAt?: string | null
          deliveryFee: number
          dispatchedAt?: string | null
          id: string
          logisticsCompanyName?: string | null
          logisticsStatus?: string | null
          orderNumber: string
          paymentConfirmation: Json
          paymentMethod: Database["public"]["Enums"]["PaymentMethod"]
          sellerBusinessName?: string
          sellerId?: string | null
          sellerName?: string
          sellerPhone?: string
          sellerRejectionReason?: string | null
          sellerWhatsApp?: string
          shippingAddress: Json
          status: Database["public"]["Enums"]["OrderStatus"]
          subtotal: number
          totalAmount: number
          trackingNumber?: string | null
          updatedAt: string
        }
        Update: {
          adminRejectionReason?: string | null
          buyerEmail?: string
          buyerId?: string
          buyerName?: string
          buyerPhone?: string
          createdAt?: string
          deliveredAt?: string | null
          deliveryFee?: number
          dispatchedAt?: string | null
          id?: string
          logisticsCompanyName?: string | null
          logisticsStatus?: string | null
          orderNumber?: string
          paymentConfirmation?: Json
          paymentMethod?: Database["public"]["Enums"]["PaymentMethod"]
          sellerBusinessName?: string
          sellerId?: string | null
          sellerName?: string
          sellerPhone?: string
          sellerRejectionReason?: string | null
          sellerWhatsApp?: string
          shippingAddress?: Json
          status?: Database["public"]["Enums"]["OrderStatus"]
          subtotal?: number
          totalAmount?: number
          trackingNumber?: string | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Order_buyerId_fkey"
            columns: ["buyerId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Order_sellerId_fkey"
            columns: ["sellerId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      OrderItem: {
        Row: {
          id: string
          orderId: string
          productId: string
          productSnapshot: Json
          quantity: number
          selectedColor: string | null
          selectedSize: string | null
          selectedVariation: string | null
          unitPrice: number
        }
        Insert: {
          id: string
          orderId: string
          productId: string
          productSnapshot: Json
          quantity: number
          selectedColor?: string | null
          selectedSize?: string | null
          selectedVariation?: string | null
          unitPrice: number
        }
        Update: {
          id?: string
          orderId?: string
          productId?: string
          productSnapshot?: Json
          quantity?: number
          selectedColor?: string | null
          selectedSize?: string | null
          selectedVariation?: string | null
          unitPrice?: number
        }
        Relationships: [
          {
            foreignKeyName: "OrderItem_orderId_fkey"
            columns: ["orderId"]
            isOneToOne: false
            referencedRelation: "Order"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "OrderItem_productId_fkey"
            columns: ["productId"]
            isOneToOne: false
            referencedRelation: "Product"
            referencedColumns: ["id"]
          },
        ]
      }
      OrderTrackingStep: {
        Row: {
          completed: boolean
          createdAt: string
          dateLabel: string
          description: string
          id: string
          orderId: string
          sortOrder: number
          title: string
        }
        Insert: {
          completed?: boolean
          createdAt?: string
          dateLabel: string
          description: string
          id: string
          orderId: string
          sortOrder: number
          title: string
        }
        Update: {
          completed?: boolean
          createdAt?: string
          dateLabel?: string
          description?: string
          id?: string
          orderId?: string
          sortOrder?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "OrderTrackingStep_orderId_fkey"
            columns: ["orderId"]
            isOneToOne: false
            referencedRelation: "Order"
            referencedColumns: ["id"]
          },
        ]
      }
      Product: {
        Row: {
          approvalStatus: Database["public"]["Enums"]["ProductApproval"]
          badge: string | null
          category: string
          categoryId: string | null
          colors: Json
          createdAt: string
          description: string
          discountPercentage: number
          id: string
          image: string
          images: Json
          isFlashSale: boolean
          isNew: boolean
          isPopular: boolean
          isSpecialOffer: boolean
          name: string
          originalPrice: number
          price: number
          sellerId: string
          sizes: Json
          stockQuantity: number
          updatedAt: string
          variations: Json
        }
        Insert: {
          approvalStatus?: Database["public"]["Enums"]["ProductApproval"]
          badge?: string | null
          category: string
          categoryId?: string | null
          colors?: Json
          createdAt?: string
          description?: string
          discountPercentage?: number
          id: string
          image: string
          images?: Json
          isFlashSale?: boolean
          isNew?: boolean
          isPopular?: boolean
          isSpecialOffer?: boolean
          name: string
          originalPrice?: number
          price: number
          sellerId: string
          sizes?: Json
          stockQuantity?: number
          updatedAt: string
          variations?: Json
        }
        Update: {
          approvalStatus?: Database["public"]["Enums"]["ProductApproval"]
          badge?: string | null
          category?: string
          categoryId?: string | null
          colors?: Json
          createdAt?: string
          description?: string
          discountPercentage?: number
          id?: string
          image?: string
          images?: Json
          isFlashSale?: boolean
          isNew?: boolean
          isPopular?: boolean
          isSpecialOffer?: boolean
          name?: string
          originalPrice?: number
          price?: number
          sellerId?: string
          sizes?: Json
          stockQuantity?: number
          updatedAt?: string
          variations?: Json
        }
        Relationships: [
          {
            foreignKeyName: "Product_categoryId_fkey"
            columns: ["categoryId"]
            isOneToOne: false
            referencedRelation: "Category"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Product_sellerId_fkey"
            columns: ["sellerId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      ProductReport: {
        Row: {
          adminNotes: string | null
          createdAt: string
          details: string
          id: string
          productId: string
          reason: string
          reporterId: string
          status: Database["public"]["Enums"]["ReportStatus"]
        }
        Insert: {
          adminNotes?: string | null
          createdAt?: string
          details: string
          id: string
          productId: string
          reason: string
          reporterId: string
          status?: Database["public"]["Enums"]["ReportStatus"]
        }
        Update: {
          adminNotes?: string | null
          createdAt?: string
          details?: string
          id?: string
          productId?: string
          reason?: string
          reporterId?: string
          status?: Database["public"]["Enums"]["ReportStatus"]
        }
        Relationships: [
          {
            foreignKeyName: "ProductReport_productId_fkey"
            columns: ["productId"]
            isOneToOne: false
            referencedRelation: "Product"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ProductReport_reporterId_fkey"
            columns: ["reporterId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      ProductReview: {
        Row: {
          buyerId: string
          comment: string
          createdAt: string
          id: string
          productId: string
          rating: number
        }
        Insert: {
          buyerId: string
          comment: string
          createdAt?: string
          id: string
          productId: string
          rating: number
        }
        Update: {
          buyerId?: string
          comment?: string
          createdAt?: string
          id?: string
          productId?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "ProductReview_buyerId_fkey"
            columns: ["buyerId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ProductReview_productId_fkey"
            columns: ["productId"]
            isOneToOne: false
            referencedRelation: "Product"
            referencedColumns: ["id"]
          },
        ]
      }
      SellerReport: {
        Row: {
          adminNotes: string | null
          buyerId: string
          createdAt: string
          details: string
          id: string
          orderId: string | null
          orderNumber: string | null
          reason: string
          sellerId: string
          status: Database["public"]["Enums"]["ReportStatus"]
        }
        Insert: {
          adminNotes?: string | null
          buyerId: string
          createdAt?: string
          details: string
          id: string
          orderId?: string | null
          orderNumber?: string | null
          reason: string
          sellerId: string
          status?: Database["public"]["Enums"]["ReportStatus"]
        }
        Update: {
          adminNotes?: string | null
          buyerId?: string
          createdAt?: string
          details?: string
          id?: string
          orderId?: string | null
          orderNumber?: string | null
          reason?: string
          sellerId?: string
          status?: Database["public"]["Enums"]["ReportStatus"]
        }
        Relationships: [
          {
            foreignKeyName: "SellerReport_buyerId_fkey"
            columns: ["buyerId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "SellerReport_orderId_fkey"
            columns: ["orderId"]
            isOneToOne: false
            referencedRelation: "Order"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "SellerReport_sellerId_fkey"
            columns: ["sellerId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Session: {
        Row: {
          createdAt: string
          expiresAt: string
          id: string
          tokenHash: string
          userId: string
        }
        Insert: {
          createdAt?: string
          expiresAt: string
          id: string
          tokenHash: string
          userId: string
        }
        Update: {
          createdAt?: string
          expiresAt?: string
          id?: string
          tokenHash?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Session_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      User: {
        Row: {
          address: string
          area: string
          businessAddress: string | null
          businessName: string | null
          city: string
          createdAt: string
          email: string
          fullName: string
          id: string
          passwordHash: string
          phone: string
          productCategory: string | null
          profileImage: string | null
          role: Database["public"]["Enums"]["Role"]
          state: string
          status: Database["public"]["Enums"]["AccountStatus"]
          updatedAt: string
          whatsAppNumber: string | null
        }
        Insert: {
          address?: string
          area?: string
          businessAddress?: string | null
          businessName?: string | null
          city?: string
          createdAt?: string
          email: string
          fullName: string
          id: string
          passwordHash: string
          phone: string
          productCategory?: string | null
          profileImage?: string | null
          role: Database["public"]["Enums"]["Role"]
          state?: string
          status?: Database["public"]["Enums"]["AccountStatus"]
          updatedAt: string
          whatsAppNumber?: string | null
        }
        Update: {
          address?: string
          area?: string
          businessAddress?: string | null
          businessName?: string | null
          city?: string
          createdAt?: string
          email?: string
          fullName?: string
          id?: string
          passwordHash?: string
          phone?: string
          productCategory?: string | null
          profileImage?: string | null
          role?: Database["public"]["Enums"]["Role"]
          state?: string
          status?: Database["public"]["Enums"]["AccountStatus"]
          updatedAt?: string
          whatsAppNumber?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      AccountStatus: "PENDING" | "ACTIVE" | "SUSPENDED" | "REJECTED"
      OrderStatus:
        | "pending"
        | "pending_order"
        | "pending_payment"
        | "pending_verification"
        | "payment_confirmed"
        | "processing"
        | "dispatched"
        | "delivered"
        | "cancelled"
        | "rejected"
      PaymentMethod: "opay" | "cod"
      ProductApproval: "PENDING_APPROVAL" | "APPROVED" | "REJECTED"
      ReportStatus:
        | "pending"
        | "reviewed"
        | "resolved"
        | "approved"
        | "rejected"
      Role: "BUYER" | "SELLER" | "SUPER_ADMIN"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      AccountStatus: ["PENDING", "ACTIVE", "SUSPENDED", "REJECTED"],
      OrderStatus: [
        "pending",
        "pending_order",
        "pending_payment",
        "pending_verification",
        "payment_confirmed",
        "processing",
        "dispatched",
        "delivered",
        "cancelled",
        "rejected",
      ],
      PaymentMethod: ["opay", "cod"],
      ProductApproval: ["PENDING_APPROVAL", "APPROVED", "REJECTED"],
      ReportStatus: ["pending", "reviewed", "resolved", "approved", "rejected"],
      Role: ["BUYER", "SELLER", "SUPER_ADMIN"],
    },
  },
} as const
