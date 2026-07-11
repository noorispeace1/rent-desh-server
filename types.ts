import { ObjectId } from "mongodb";

export interface Property {
  _id?: ObjectId;
  title?: string;
  monthlyRent?: number | string;
  location?: string;
  propertyType?: string;
  bedroom?: number | string;
  bathroom?: number | string;
  propertySize?: number | string;
  imageUrl?: string;
  ownerEmail?: string;
  status?: string;
  [key: string]: any;
}

export interface User {
  _id?: ObjectId;
  email?: string;
  role?: string;
  name?: string;
  [key: string]: any;
}

export interface Booking {
  _id?: ObjectId;
  propertyId?: string;
  userId?: string;
  email?: string;
  userName?: string;
  status?: string;
  paymentStatus?: string;
  transactionId?: string;
  createdAt?: string;
  monthlyRent?: number | string;
  [key: string]: any;
}

export interface Review {
  _id?: ObjectId;
  propertyId?: string;
  userId?: string;
  email?: string;
  rating?: number;
  comment?: string;
  createdAt?: string;
}
