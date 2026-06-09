import AIInsight from "../models/AIInsight.js";

class AIInsightRepository {
  async create(data) {
    return await AIInsight.create(data);
  }

  async findLatestByType(userId, type) {
    return await AIInsight.findOne({ userId, type }).sort({ createdAt: -1 });
  }
}

export default new AIInsightRepository();
