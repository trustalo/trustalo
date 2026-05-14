import { Schema, model, type Document } from "mongoose";

interface QuestionnaireAnswer {
  questionId: string;
  question: string;
  answer: string;
  notes?: string;
}

export interface IQuestionnaireResponse extends Document {
  tenantId: string;
  questionnaireType: string;
  title: string;
  respondentId: string;
  vendorId?: string;
  responses: QuestionnaireAnswer[];
  status: string;
  submittedAt?: Date;
  reviewedById?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const questionnaireResponseSchema = new Schema<IQuestionnaireResponse>(
  {
    tenantId: { type: String, required: true, index: true },
    questionnaireType: { type: String, required: true },
    title: { type: String, required: true },
    respondentId: { type: String, required: true },
    vendorId: { type: String },
    responses: [
      {
        questionId: { type: String, required: true },
        question: { type: String, required: true },
        answer: { type: String, required: true },
        notes: { type: String },
      },
    ],
    status: {
      type: String,
      required: true,
      enum: ["draft", "submitted", "reviewed"],
      default: "draft",
    },
    submittedAt: { type: Date },
    reviewedById: { type: String },
    reviewedAt: { type: Date },
  },
  { timestamps: true },
);

questionnaireResponseSchema.index({ tenantId: 1, questionnaireType: 1 });

export const QuestionnaireResponse = model<IQuestionnaireResponse>(
  "QuestionnaireResponse",
  questionnaireResponseSchema,
);
