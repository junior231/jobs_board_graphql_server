import { Job, Company } from "./db.js";
function rejectIf(condition) {
  if (condition) {
    throw new Error("Unauthorized");
  }
}

export const resolvers = {
  Query: {
    // first arg is the root/parent object, second is the arg passed in the schema which we then destructure to get the id
    job: (_root, { id }) => Job.findById(id),
    company: (_root, { id }) => Company.findById(id),
    jobs: () => Job.findAll(),
  },

  Mutation: {
    // before adding input types
    // createJob: (_root, args) => {
    //   // destructure parameters from args passed in schema
    //   const { title, companyId, description } = args;
    //   return Job.create({ title, companyId, description });
    // },

    // with input types, destructure input from args
    createJob: (_root, { input }, context) => {
      const { user } = context;
      rejectIf(!user);
      return Job.create({ ...input, companyId: user.companyId });
    },
    deleteJob: async (_root, args, context) => {
      const { id } = args;
      const { user } = context;

      // check if user is authenticated and if job belongs to their company
      rejectIf(!user);
      const job = await Job.findById(id);
      rejectIf(job.companyId !== user.companyId);
      return Job.delete(id);
    },
    updateJob: async (_root, { input }, context) => {
      const { user } = context;
      // check if user is authenticated and if job belongs to their company
      rejectIf(!user);
      // find job being updated by getting id from passed-in input.id, then check if job belongs to user's company.
      const job = await Job.findById(input.id);
      rejectIf(job.companyId !== user.companyId);
      return Job.update({ ...input, companyId: user.companyId });
    },
  },

  Company: {
    jobs: (company) => Job.findAll((job) => job.companyId === company.id),
  },

  Job: {
    company: (job) => {
      // job object is fetched from the jobs resolver in type Query
      return Company.findById(job.companyId);
    },
  },
};
