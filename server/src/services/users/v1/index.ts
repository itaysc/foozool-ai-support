import { UserModel, OrganizationModel } from '../../../schemas';
import { IUser, IResponse, IOrganization } from 'src/types';
import ElasticsearchService from '../../../elasticsearch/service';
import mongoose from 'mongoose';

export async function getUserByEmail({ email }) : Promise<IResponse> {
  try {
    console.log('getUserByEmail called for email:', email);
    
    // Check if mongoose is connected
    if (mongoose.connection.readyState !== 1) {
      console.error('Database not connected. Ready state:', mongoose.connection.readyState);
      return {
        status: 503,
        payload: { error: 'Database connection not available' },
      };
    }
    
    const user = await UserModel.findOne({ email }).lean();
    console.log('User lookup result:', user ? 'found' : 'not found');
    return {
      status: user ? 200 : 404,
      payload: user,
    };
  } catch (error) {
    console.error('Error in getUserByEmail:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
        console.error('Database connection timeout - connection may be down');
        return {
          status: 503,
          payload: { error: 'Database connection timeout' },
        };
      }
      
      if (error.name === 'MongoNetworkError') {
        console.error('MongoDB network error - connection issues');
        return {
          status: 503,
          payload: { error: 'Database network error' },
        };
      }
    }
    
    return {
      status: 500,
      payload: { error: 'Database query failed' },
    };
  }
}

export async function createOrganization(organization: IOrganization) : Promise<IResponse> {
  const org = new OrganizationModel(organization);
  const res = await org.save();
  return {
    status: 201,
    payload: res,
  };
}
export async function createUser(user: IUser) : Promise<IResponse> {
  const fullName = `${user.firstName} ${user.lastName}`;
  const userItem = new UserModel({ ...user, fullName });
  const savedUser = await userItem.save();
  const esData = {
    userId: savedUser._id.toString(),
    email: savedUser.email,
    firstName: savedUser.firstName,
    lastName: savedUser.lastName,
    fullName: savedUser.fullName,
    organizationId: user?.organization?.toString() || '',
  };
  const esClient = new ElasticsearchService();
  await esClient.addToIndex({ index: 'users', data: esData });
  return {
    status: 201,
    payload: savedUser,
  };
}

export async function createUser2(user: IUser, createdBy: IUser) : Promise<IResponse> {
  const org = await OrganizationModel.findOne({ _id: createdBy.organization }).select({ _id: 1 });
  if (!org) {
    return {
      status: 400,
      payload: 'Organization not found.',
    };
  }
  const fullName = `${user.firstName} ${user.lastName}`;
  const userItem = new UserModel({ ...user, fullName, organization: org._id });
  const savedUser = await userItem.save();
  const esData = {
    userId: savedUser._id.toString(),
    email: savedUser.email,
    firstName: savedUser.firstName,
    lastName: savedUser.lastName,
    fullName: savedUser.fullName,
    organizationId: user?.organization?.toString() || '',
  };
  const esClient = new ElasticsearchService();
  await esClient.addToIndex({ index: 'users', data: esData });
  return {
    status: 201,
    payload: savedUser,
  };
}