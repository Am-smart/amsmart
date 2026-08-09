import { authService } from './auth.service';
import { learningService } from './learning.service';
import { assessmentService } from './assessment.service';
import { systemService } from './system.service';
import { pushService } from './push.service';
import { certificateService } from './certificate.service';
import { proctoringService } from './proctoring.service';
import { studyService } from './study.service';
import { curriculumService } from './curriculum.service';
import { serviceRegistry } from './service-registry';

// Initialize and Register Services
const initializeRegistry = () => {
  if (serviceRegistry.isInitialized()) return;

  serviceRegistry.register('authService', authService);
  serviceRegistry.register('learningService', learningService);
  serviceRegistry.register('assessmentService', assessmentService);
  serviceRegistry.register('systemService', systemService);
  serviceRegistry.register('pushService', pushService);
  serviceRegistry.register('certificateService', certificateService);
  serviceRegistry.register('proctoringService', proctoringService);
  serviceRegistry.register('studyService', studyService);
  serviceRegistry.register('curriculumService', curriculumService);

  serviceRegistry.markInitialized();
};

// Execute registration
initializeRegistry();

export * from './auth.service';
export * from './learning.service';
export * from './system.service';
export * from './assessment.service';
export * from './push.service';
export * from './certificate.service';
export * from './proctoring.service';
export * from './study.service';
export * from './curriculum.service';
export * from './service-registry';
