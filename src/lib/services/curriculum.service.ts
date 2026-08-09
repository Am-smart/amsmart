import { curriculumDb } from '../database/curriculum.db.server';
import { learningDb } from '../database/learning.db.server';
import { discussionViewDb } from '../database/discussion-views.db.server';
import { rbac } from '../auth/rbac';
import { Topic, User } from '../types';
import { BadRequestError, ForbiddenError, NotFoundError } from '../api-error';

export class CurriculumService {
  async getTopics(currentUser: User, courseId: string, sessionId: string): Promise<Topic[]> {
    if (!courseId) throw new BadRequestError('courseId is required');
    return curriculumDb.findTopicsByCourse(courseId, sessionId);
  }

  async saveTopic(currentUser: User, topic: Partial<Topic>, sessionId: string): Promise<Topic> {
    if (!topic.course_id) throw new BadRequestError('courseId is required');
    if (!topic.title) throw new BadRequestError('Title is required');
    await this.assertCanManageCourse(currentUser, topic.course_id, sessionId);
    return curriculumDb.upsertTopic(topic, sessionId);
  }

  async deleteTopic(currentUser: User, id: string, sessionId: string): Promise<void> {
    const existing = await curriculumDb.findTopicById(id, sessionId);
    if (!existing) throw new NotFoundError('Topic not found');
    await this.assertCanManageCourse(currentUser, existing.course_id, sessionId);
    await curriculumDb.deleteTopic(id, sessionId);
  }

  /** Read receipts — always keyed to the acting user. */
  async getDiscussionViews(currentUser: User, sessionId: string) {
    return discussionViewDb.findByUser(currentUser.id, sessionId);
  }

  async markDiscussionViewed(currentUser: User, discussionId: string, sessionId: string): Promise<void> {
    if (!discussionId) throw new BadRequestError('discussionId is required');
    await discussionViewDb.markViewed(discussionId, currentUser.id, sessionId);
  }

  private async assertCanManageCourse(currentUser: User, courseId: string, sessionId: string): Promise<void> {
    if (!rbac.can(currentUser, 'lesson:manage')) throw new ForbiddenError('Not allowed');
    const course = await learningDb.findCourseById(courseId, sessionId);
    if (!course) throw new NotFoundError('Course not found');
    if (!rbac.canManageCourse(currentUser, course)) throw new ForbiddenError('You do not own this course');
  }
}

export const curriculumService = new CurriculumService();
