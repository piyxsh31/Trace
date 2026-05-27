const Problem = require('../models/problem.model');
const AppError = require('../utils/app-error');

/**
 * GET /api/v1/analytics
 * Returns aggregated analytics data for the dashboard.
 *
 * @type {import('express').RequestHandler}
 */
const getAnalyticsDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const results = await Problem.aggregate([
      { $match: { userId } },
      {
        $facet: {
          heatmap: [
            { $match: { status: 'solved' } },
            {
              $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: { $ifNull: ['$solvedAt', '$updatedAt'] } } },
                count: { $sum: 1 },
              },
            },
            { $project: { _id: 0, date: '$_id', count: 1 } },
          ],
          difficulty: [
            {
              $group: {
                _id: '$difficulty',
                total: { $sum: 1 },
                solved: { $sum: { $cond: [{ $eq: ['$status', 'solved'] }, 1, 0] } },
              },
            },
            { $project: { _id: 0, difficulty: '$_id', total: 1, solved: 1 } },
          ],
          topics: [
            { $match: { status: 'solved' } },
            { $unwind: '$topics' },
            { $match: { topics: { $ne: '' } } },
            { $group: { _id: '$topics', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 30 },
            { $project: { _id: 0, topic: '$_id', count: 1 } },
          ],
          totals: [
            {
              $group: {
                _id: null,
                totalProblems: { $sum: 1 },
                totalSolved: { $sum: { $cond: [{ $eq: ['$status', 'solved'] }, 1, 0] } },
                totalAttempted: { $sum: { $cond: [{ $eq: ['$status', 'attempted'] }, 1, 0] } },
              },
            },
          ],
          recent: [
            { $match: { status: 'solved' } },
            { $addFields: { effectiveDate: { $ifNull: ['$solvedAt', '$updatedAt'] } } },
            { $sort: { effectiveDate: -1 } },
            { $limit: 10 },
            {
              $lookup: {
                from: 'sheets',
                localField: 'sheetId',
                foreignField: '_id',
                as: 'sheet',
              },
            },
            { $unwind: '$sheet' },
            {
              $project: {
                id: '$_id',
                _id: 0,
                name: 1,
                difficulty: 1,
                solvedAt: '$effectiveDate',
                sheetName: '$sheet.name',
              },
            },
          ],
        },
      },
    ]);

    const data = results[0];

    const totals = data.totals[0] || { totalProblems: 0, totalSolved: 0, totalAttempted: 0 };

    const difficultyMap = {
      easy: { solved: 0, total: 0 },
      medium: { solved: 0, total: 0 },
      hard: { solved: 0, total: 0 },
    };
    
    data.difficulty.forEach((d) => {
      const diff = d.difficulty || 'unrated';
      if (difficultyMap[diff]) {
        difficultyMap[diff] = { solved: d.solved, total: d.total };
      }
    });

    const heatmap = data.heatmap;
    const sortedDates = heatmap.map((h) => h.date).sort();

    let longestStreak = 0;
    let tempStreak = 0;
    if (sortedDates.length > 0) {
      tempStreak = 1;
      longestStreak = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        const prev = new Date(sortedDates[i - 1]);
        const curr = new Date(sortedDates[i]);
        const diffTime = Math.abs(curr - prev);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      }
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const solvedDates = new Set(heatmap.map((h) => h.date));

    let checkDate = new Date(todayStr);
    if (!solvedDates.has(todayStr) && solvedDates.has(yesterdayStr)) {
      checkDate = new Date(yesterdayStr);
    }

    let currentStreak = 0;
    while (true) {
      const dStr = checkDate.toISOString().split('T')[0];
      if (solvedDates.has(dStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        heatmap,
        difficulty: [
          { name: 'Easy', solved: difficultyMap.easy.solved, total: difficultyMap.easy.total, color: '#10b981' },
          { name: 'Medium', solved: difficultyMap.medium.solved, total: difficultyMap.medium.total, color: '#eab308' },
          { name: 'Hard', solved: difficultyMap.hard.solved, total: difficultyMap.hard.total, color: '#ef4444' },
        ],
        topics: data.topics,
        recentActivity: data.recent,
        totals,
        streaks: {
          current: currentStreak,
          longest: longestStreak,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnalyticsDashboard,
};
