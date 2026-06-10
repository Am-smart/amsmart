import { LiveClass, Discussion, Broadcast } from '../types';

export class CommunicationDomain {
  static validateDiscussionPost(post: Partial<Discussion>) {
    if (!post.content) throw new Error('Post content is required');
    if (!post.course_id) throw new Error('Course ID is required');
  }

  static prepareLiveClass(liveClass: Partial<LiveClass>, teacherId: string): Partial<LiveClass> {
    return {
      ...liveClass,
      teacher_id: liveClass.teacher_id || teacherId,
      status: liveClass.status || 'scheduled',
      recurring_config: liveClass.recurring_config || {},
      metadata: liveClass.metadata || {}
    };
  }

  static prepareDiscussion(post: Partial<Discussion>, userId: string): Partial<Discussion> {
    return {
      ...post,
      user_id: post.user_id || userId
    };
  }

  static prepareBroadcast(broadcast: Partial<Broadcast>): Partial<Broadcast> {
    return {
      ...broadcast,
      type: broadcast.type || 'system'
    };
  }
}
