import { UserModel, OrganizationModel } from '../../../schemas';
import { IUser, IResponse, IOrganization } from '@common/types';
import ElasticsearchService from '../../../services/elasticsearch/service';

export async function getUserByEmail({ email }) : Promise<IResponse> {
  const user = await UserModel.findOne({ email }).lean();
  return {
    status: user ? 200 : 404,
    payload: user,
  };
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