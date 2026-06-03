import AIInsight from "../models/AIInsight.js";

class AIInsightRepository {
  async create(data) {
    return await AIInsight.create(data);
  }
}

export default new AIInsightRepository();
