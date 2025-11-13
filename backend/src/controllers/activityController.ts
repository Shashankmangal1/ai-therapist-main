import { Request, Response, NextFunction } from "express";
import { Activity } from "../models/Activity";
import { logger } from "../utils/logger";
import { sendActivityCompletionEvent } from "../utils/inngestEvents";
import { Types } from "mongoose";

// Log a new activity
export const logActivity = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { type, name, description, duration, difficulty, feedback } =
      req.body;
    
    if (!req.user?.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const userId = new Types.ObjectId(req.user.id);

    // Normalize type to lowercase for enum validation
    const normalizedType = type?.toLowerCase();

    const activity = new Activity({
      userId,
      type: normalizedType,
      name,
      description,
      duration,
      difficulty,
      feedback,
      timestamp: new Date(),
    });

    await activity.save();
    logger.info(`Activity logged for user ${userId}`);

    // Send activity completion event to Inngest
    await sendActivityCompletionEvent({
      userId,
      id: activity._id,
      type,
      name,
      duration,
      difficulty,
      feedback,
      timestamp: activity.timestamp,
    });

    res.status(201).json({
      success: true,
      data: activity,
    });
  } catch (error) {
    next(error);
  }
};

// Get today's activities for the authenticated user
export const getTodayActivities = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const userId = new Types.ObjectId(req.user.id);
    
    // Get start of today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    
    // Get end of today
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const activities = await Activity.find({
      userId,
      timestamp: {
        $gte: startOfToday,
        $lte: endOfToday,
      },
    })
      .sort({ timestamp: -1 })
      .lean();

    logger.info(`Found ${activities.length} activities for user ${userId} today`);

    res.json(activities);
  } catch (error) {
    logger.error("Error fetching today's activities:", error);
    next(error);
  }
};
