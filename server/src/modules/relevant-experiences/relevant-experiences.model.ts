import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

const relevantExperiencesTextOverrideSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    title: { type: String, trim: true, default: undefined },
    details: { type: String, trim: true, default: undefined },
  },
  { _id: false },
);

const relevantExperiencesNodeOverrideSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    x: { type: Number, default: undefined },
    y: { type: Number, default: undefined },
    width: { type: Number, default: undefined },
    height: { type: Number, default: undefined },
  },
  { _id: false },
);

const relevantExperiencesNodeLayoutSchema = new Schema(
  {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
  },
  { _id: false },
);

const relevantExperiencesNodeSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    type: { type: String, required: true, enum: ['parent', 'child'] },
    parentId: { type: String, trim: true, default: undefined },
    title: { type: String, required: true, trim: true },
    details: { type: String, required: true, trim: true },
    tags: { type: [String], default: undefined },
    image: { type: String, trim: true, default: undefined },
    icon: {
      type: String,
      trim: true,
      enum: ['briefcase-business', 'folder-kanban'],
      default: undefined,
    },
    layout: { type: relevantExperiencesNodeLayoutSchema, required: true },
  },
  { _id: false },
);

const relevantExperiencesConnectionPointSchema = new Schema(
  {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
  },
  { _id: false },
);

const relevantExperiencesConnectionSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    from: { type: String, required: true, trim: true },
    to: { type: String, required: true, trim: true },
    fromAnchor: { type: String, required: true, enum: ['top', 'right', 'bottom', 'left'] },
    toAnchor: { type: String, required: true, enum: ['top', 'right', 'bottom', 'left'] },
    viaPoints: { type: [relevantExperiencesConnectionPointSchema], default: [] },
    variant: { type: String, required: true, enum: ['group', 'detail'] },
  },
  { _id: false },
);

const relevantExperiencesDocumentSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    nodes: { type: [relevantExperiencesNodeSchema], default: [] },
    connections: { type: [relevantExperiencesConnectionSchema], default: [] },
    textOverrides: { type: [relevantExperiencesTextOverrideSchema], default: undefined },
    nodeOverrides: { type: [relevantExperiencesNodeOverrideSchema], default: undefined },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type RelevantExperiencesDocumentModel = InferSchemaType<
  typeof relevantExperiencesDocumentSchema
>;

export type RelevantExperiencesDocument = HydratedDocument<RelevantExperiencesDocumentModel>;

export const RelevantExperiencesModel = model(
  'RelevantExperiences',
  relevantExperiencesDocumentSchema,
);
