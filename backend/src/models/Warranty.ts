import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import User from './User';

// Define Warranty status types
export enum WarrantyStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  MANUAL_REVIEW = 'manual_review'
}

// Define Warranty attributes
interface WarrantyAttributes {
  id: number;
  customerName: string;
  customerPhone: string;
  productName: string;
  installationDate: Date;
  invoiceDate?: Date;
  invoice: {
    uri: string;
    name: string;
    type: string;
  };
  invoiceUrl: string;
  status: WarrantyStatus;
  userId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Invoice {
  uri: string;
  name: string;
  type: string;
}

// Define Optional attributes for creating a new Warranty
export interface WarrantyCreationAttributes extends Optional<WarrantyAttributes, 'id' | 'invoiceDate'> {}

// Define the Warranty model class
class Warranty extends Model<WarrantyAttributes, WarrantyCreationAttributes> implements WarrantyAttributes {
  public id!: number;
  public customerName!: string;
  public customerPhone!: string;
  public productName!: string;
  public installationDate!: Date;
  public invoiceDate?: Date;
  public invoice!: Invoice;
  public invoiceUrl!: string;
  public status!: WarrantyStatus;
  public userId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize the Warranty model
Warranty.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    customerName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    customerPhone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    productName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    installationDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    invoiceDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    invoiceUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    invoice: {
      type: DataTypes.JSON,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM(...Object.values(WarrantyStatus)),
      allowNull: false,
      defaultValue: WarrantyStatus.PENDING,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    tableName: 'warranties',
    sequelize,
  }
);

// Define the relationship between User and Warranty
User.hasMany(Warranty, { foreignKey: 'userId' });
Warranty.belongsTo(User, { foreignKey: 'userId' });

export default Warranty; 