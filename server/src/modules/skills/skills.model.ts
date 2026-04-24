import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

const skillsStackSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    icon: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const skillsCardLayoutSchema = new Schema(
  {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
  },
  { _id: false },
);

const skillsLineLayoutSchema = new Schema(
  {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    rotation: { type: Number, required: true, default: 0 },
  },
  { _id: false },
);

const skillsTitleLayoutSchema = new Schema(
  {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
  },
  { _id: false },
);

const skillsLineSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    layout: { type: skillsLineLayoutSchema, required: true },
  },
  { _id: false },
);

const skillsCardSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    frontLabel: { type: String, required: true, trim: true },
    backLabel: { type: String, required: true, trim: true },
    currentStacks: { type: [skillsStackSchema], default: [] },
    previousStacks: { type: [skillsStackSchema], default: [] },
    layout: { type: skillsCardLayoutSchema, required: true },
  },
  { _id: false },
);

const skillsLayoutCardSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    layout: { type: skillsCardLayoutSchema, required: true },
  },
  { _id: false },
);

const skillsLayoutStateSchema = new Schema(
  {
    cards: { type: [skillsLayoutCardSchema], default: [] },
  },
  { _id: false },
);

const skillsDocumentSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    intro: { type: String, required: true, trim: true },
    cards: { type: [skillsCardSchema], default: [] },
    titleLayout: { type: skillsTitleLayoutSchema, default: undefined },
    lines: { type: [skillsLineSchema], default: [] },
    mdLayout: { type: skillsLayoutStateSchema, default: undefined },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type SkillsDocumentModel = InferSchemaType<typeof skillsDocumentSchema>;
export type SkillsDocument = HydratedDocument<SkillsDocumentModel>;

export const SkillsModel = model('Skills', skillsDocumentSchema);
