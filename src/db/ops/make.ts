import type { Document, FilterQuery, Model } from 'mongoose'
import { pick, isEmpty } from 'lodash'
import * as context from '../../context'
import _ from 'lodash'

export type FindOneOptions = {
  populate?: Record<string, unknown>[],
  select?: string
}

export type FindOptions = {
  sort?: string
  limit?: number
  skip?: number
  populate?: Record<string, unknown>[],
  select?: string
}

const findDocumentById = async <Doc extends Document, M extends Model<Doc>>(
  ctx: context.Context,
  model: M,
  id: Doc['id'],
  { populate,select }: FindOneOptions,
): Promise<Doc | null> => {
  const q = model.findById(id).session(ctx.session)
  if (!isEmpty(select)) {
    q.select(select)
  }
  if (!isEmpty(populate)) {
    populate.forEach(p => q.populate(p))
  }
  return q
}

const findOneDocument = async <Doc extends Document, M extends Model<Doc>>(
  ctx: context.Context,
  model: M,
  query: FilterQuery<Doc>,
  { populate,select }: FindOneOptions,
): Promise<Doc> => {
  const q = model.findOne(query).session(ctx.session)
  if (!isEmpty(select)) {
    q.select(select)
  }
  if (!isEmpty(populate)) {
    populate.forEach(p => q.populate(p))
  }
  return q
}

const findDocuments = async <Doc extends Document, M extends Model<Doc>>(
  ctx: context.Context,
  model: M,
  query: FilterQuery<Doc>,
  { limit, skip, sort, populate,select }: FindOptions,
): Promise<Doc[]> => {
  const q = model.find(query).session(ctx.session)
  if (sort) {
    q.sort(sort)
  }
  if (skip) {
    q.skip(skip)
  }
  if (limit) {
    q.limit(limit)
  }
  if (!isEmpty(select)) {
    q.select(select)
  }
  if (!isEmpty(populate)) {
    populate.forEach(p => q.populate(p))
  }
  return q
}

const countDocuments = async <Doc extends Document, M extends Model<Doc>>(
  ctx: context.Context,
  model: M,
  query: FilterQuery<Doc>,
): Promise<number> => {
  return model.countDocuments(query).session(ctx.session)
}

const createDocument = async <Doc extends Document, M extends Model<Doc>>(
  ctx: context.Context,
  model: M,
  data: unknown,
): Promise<Doc> => {
  return new model(data).save({
    validateBeforeSave: true,
    session: ctx.session,
  })
}

const updateDocument = async <Doc extends Document, M extends Model<Doc>>(
  ctx: context.Context,
  model: M,
  doc: Doc,
  updates,
): Promise<Doc> => {
  return model.findByIdAndUpdate(doc.id, updates, {
    runValidators: true,
    new: true,
    session: ctx.session,
  })
}

const deleteDocument = async <Doc extends Document, M extends Model<Doc>>(
  ctx: context.Context,
  model: M,
  doc: Doc,
): Promise<Doc> => {
  return model.findByIdAndDelete({ _id: doc._id }).session(ctx.session)
}

type Props = {
  create: readonly string[]
  update: readonly string[]
}

export type Ops<Doc extends Document> = {
  findById(
    ctx: context.Context | null,
    id: Doc['id'],
    options?: FindOneOptions,
  ): Promise<Doc | null>
  findOne(
    ctx: context.Context | null,
    query: FilterQuery<Doc>,
    options?: FindOneOptions,
  ): Promise<Doc>
  find(ctx: context.Context | null, query: FilterQuery<Doc>, options?: FindOptions): Promise<Doc[]>
  count(ctx: context.Context | null, query: FilterQuery<Doc>): Promise<number>
  create(ctx: context.Context | null, data: unknown): Promise<Doc>
  update(ctx: context.Context | null, doc: Doc, data: unknown): Promise<Doc>
  delete(ctx: context.Context | null, doc: Doc): Promise<Doc>
}

export default <Doc extends Document>(model: Model<Doc>, props: Props): Ops<Doc> => ({
  findById: (ctx, id, options = {}) => {
    return findDocumentById(context.make(ctx), model, id, options)
  },
  findOne: (ctx, query, options = {}) => {
    return findOneDocument(context.make(ctx), model, query, options)
  },
  find: (ctx, query, options = {}) => {
    return findDocuments(context.make(ctx), model, query, options)
  },
  count: (ctx, query) => {
    return countDocuments(context.make(ctx), model, query)
  },
  create: (ctx, data) => {
    return createDocument(context.make(ctx), model, pick(data, props.create))
  },
  update: (ctx, doc, data) => {
    return updateDocument(context.make(ctx), model, doc, pick(data, props.update))
  },
  delete: (ctx, doc) => {
    return deleteDocument(context.make(ctx), model, doc)
  },
})
