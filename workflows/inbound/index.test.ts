import { describe, it, expect, vi, beforeEach } from 'vitest';
import { workflowInbound } from './index';
import * as steps from './steps';
import { type Lead } from '@/db/schema';

// Mock all workflow steps
vi.mock('./steps');

describe('Workflow Inbound', () => {
  const mockLead: Lead = {
    id: 'lead_123',
    orgId: 'org_123',
    userId: 'user_123',
    name: 'John Doe',
    email: 'john@example.com',
    company: 'ACME Corp',
    phone: '555-1234',
    message: 'Interested in learning more',
    qualificationCategory: null,
    qualificationReason: null,
    emailDraft: null,
    researchResults: null,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    deletedBy: null,
    deletionReason: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Successful workflow execution', () => {
    it('should complete workflow successfully for QUALIFIED lead', async () => {
      const mockWorkflow = { id: 'wf_123', status: 'running' };

      vi.mocked(steps.stepCreateWorkflow).mockResolvedValue(mockWorkflow as any);
      vi.mocked(steps.stepResearch).mockResolvedValue('Research data about ACME Corp');
      vi.mocked(steps.stepQualify).mockResolvedValue({
        category: 'QUALIFIED',
        reason: 'Strong product fit',
        score: 85,
      } as any);
      vi.mocked(steps.stepSaveQualification).mockResolvedValue(undefined);
      vi.mocked(steps.stepWriteEmail).mockResolvedValue('Email draft content');
      vi.mocked(steps.stepSaveWorkflowData).mockResolvedValue(undefined);
      vi.mocked(steps.stepHumanFeedback).mockResolvedValue(undefined);
      vi.mocked(steps.stepFinalizeWorkflow).mockResolvedValue(undefined);

      await workflowInbound(mockLead);

      expect(steps.stepCreateWorkflow).toHaveBeenCalledWith(mockLead);
      expect(steps.stepResearch).toHaveBeenCalledWith(mockLead, 'wf_123');
      expect(steps.stepQualify).toHaveBeenCalled();
      expect(steps.stepSaveQualification).toHaveBeenCalled();
      expect(steps.stepWriteEmail).toHaveBeenCalled();
      expect(steps.stepHumanFeedback).toHaveBeenCalled();
      expect(steps.stepFinalizeWorkflow).toHaveBeenCalledWith('wf_123', 'completed');
    });

    it('should complete workflow successfully for FOLLOW_UP lead', async () => {
      const mockWorkflow = { id: 'wf_456', status: 'running' };

      vi.mocked(steps.stepCreateWorkflow).mockResolvedValue(mockWorkflow as any);
      vi.mocked(steps.stepResearch).mockResolvedValue('Research data');
      vi.mocked(steps.stepQualify).mockResolvedValue({
        category: 'FOLLOW_UP',
        reason: 'Needs nurturing',
        score: 60,
      } as any);
      vi.mocked(steps.stepSaveQualification).mockResolvedValue(undefined);
      vi.mocked(steps.stepWriteEmail).mockResolvedValue('Email draft');
      vi.mocked(steps.stepSaveWorkflowData).mockResolvedValue(undefined);
      vi.mocked(steps.stepHumanFeedback).mockResolvedValue(undefined);
      vi.mocked(steps.stepFinalizeWorkflow).mockResolvedValue(undefined);

      await workflowInbound(mockLead);

      expect(steps.stepWriteEmail).toHaveBeenCalled();
      expect(steps.stepFinalizeWorkflow).toHaveBeenCalledWith('wf_456', 'completed');
    });

    it('should skip email for UNQUALIFIED lead', async () => {
      const mockWorkflow = { id: 'wf_789', status: 'running' };

      vi.mocked(steps.stepCreateWorkflow).mockResolvedValue(mockWorkflow as any);
      vi.mocked(steps.stepResearch).mockResolvedValue('Research data');
      vi.mocked(steps.stepQualify).mockResolvedValue({
        category: 'UNQUALIFIED',
        reason: 'Not a fit',
        score: 20,
      } as any);
      vi.mocked(steps.stepSaveQualification).mockResolvedValue(undefined);
      vi.mocked(steps.stepFinalizeWorkflow).mockResolvedValue(undefined);

      await workflowInbound(mockLead);

      expect(steps.stepWriteEmail).not.toHaveBeenCalled();
      expect(steps.stepHumanFeedback).not.toHaveBeenCalled();
      expect(steps.stepFinalizeWorkflow).toHaveBeenCalledWith('wf_789', 'completed');
    });

    it('should skip email for SUPPORT lead', async () => {
      const mockWorkflow = { id: 'wf_support', status: 'running' };

      vi.mocked(steps.stepCreateWorkflow).mockResolvedValue(mockWorkflow as any);
      vi.mocked(steps.stepResearch).mockResolvedValue('Research data');
      vi.mocked(steps.stepQualify).mockResolvedValue({
        category: 'SUPPORT',
        reason: 'Existing customer inquiry',
        score: 50,
      } as any);
      vi.mocked(steps.stepSaveQualification).mockResolvedValue(undefined);
      vi.mocked(steps.stepFinalizeWorkflow).mockResolvedValue(undefined);

      await workflowInbound(mockLead);

      expect(steps.stepWriteEmail).not.toHaveBeenCalled();
      expect(steps.stepFinalizeWorkflow).toHaveBeenCalledWith('wf_support', 'completed');
    });
  });

  describe('Error handling - stepCreateWorkflow fails', () => {
    it('should throw error and NOT call stepFinalizeWorkflow if stepCreateWorkflow fails', async () => {
      const error = new Error('Database connection failed');
      vi.mocked(steps.stepCreateWorkflow).mockRejectedValue(error);

      await expect(workflowInbound(mockLead)).rejects.toThrow('Database connection failed');

      // Should NOT call finalize because workflow was never created
      expect(steps.stepFinalizeWorkflow).not.toHaveBeenCalled();
      expect(steps.stepResearch).not.toHaveBeenCalled();
    });
  });

  describe('Error handling - stepResearch fails', () => {
    it('should finalize workflow as failed if stepResearch fails', async () => {
      const mockWorkflow = { id: 'wf_error', status: 'running' };
      const researchError = new Error('Research API failed');

      vi.mocked(steps.stepCreateWorkflow).mockResolvedValue(mockWorkflow as any);
      vi.mocked(steps.stepResearch).mockRejectedValue(researchError);
      vi.mocked(steps.stepFinalizeWorkflow).mockResolvedValue(undefined);

      await expect(workflowInbound(mockLead)).rejects.toThrow('Research API failed');

      // Should finalize as failed
      expect(steps.stepFinalizeWorkflow).toHaveBeenCalledWith('wf_error', 'failed');
    });
  });

  describe('Error handling - stepQualify fails', () => {
    it('should finalize workflow as failed if stepQualify fails', async () => {
      const mockWorkflow = { id: 'wf_qualify_error', status: 'running' };
      const qualifyError = new Error('AI qualification failed');

      vi.mocked(steps.stepCreateWorkflow).mockResolvedValue(mockWorkflow as any);
      vi.mocked(steps.stepResearch).mockResolvedValue('Research data');
      vi.mocked(steps.stepQualify).mockRejectedValue(qualifyError);
      vi.mocked(steps.stepFinalizeWorkflow).mockResolvedValue(undefined);

      await expect(workflowInbound(mockLead)).rejects.toThrow('AI qualification failed');

      expect(steps.stepFinalizeWorkflow).toHaveBeenCalledWith('wf_qualify_error', 'failed');
    });
  });

  describe('Error handling - stepSaveQualification fails', () => {
    it('should finalize workflow as failed if stepSaveQualification fails', async () => {
      const mockWorkflow = { id: 'wf_save_error', status: 'running' };
      const saveError = new Error('Database save failed');

      vi.mocked(steps.stepCreateWorkflow).mockResolvedValue(mockWorkflow as any);
      vi.mocked(steps.stepResearch).mockResolvedValue('Research data');
      vi.mocked(steps.stepQualify).mockResolvedValue({
        category: 'QUALIFIED',
        reason: 'Good fit',
        score: 80,
      } as any);
      vi.mocked(steps.stepSaveQualification).mockRejectedValue(saveError);
      vi.mocked(steps.stepFinalizeWorkflow).mockResolvedValue(undefined);

      await expect(workflowInbound(mockLead)).rejects.toThrow('Database save failed');

      expect(steps.stepFinalizeWorkflow).toHaveBeenCalledWith('wf_save_error', 'failed');
    });
  });

  describe('Error handling - stepWriteEmail fails', () => {
    it('should finalize workflow as failed if stepWriteEmail fails', async () => {
      const mockWorkflow = { id: 'wf_email_error', status: 'running' };
      const emailError = new Error('Email generation failed');

      vi.mocked(steps.stepCreateWorkflow).mockResolvedValue(mockWorkflow as any);
      vi.mocked(steps.stepResearch).mockResolvedValue('Research data');
      vi.mocked(steps.stepQualify).mockResolvedValue({
        category: 'QUALIFIED',
        reason: 'Good fit',
        score: 80,
      } as any);
      vi.mocked(steps.stepSaveQualification).mockResolvedValue(undefined);
      vi.mocked(steps.stepWriteEmail).mockRejectedValue(emailError);
      vi.mocked(steps.stepFinalizeWorkflow).mockResolvedValue(undefined);

      await expect(workflowInbound(mockLead)).rejects.toThrow('Email generation failed');

      expect(steps.stepFinalizeWorkflow).toHaveBeenCalledWith('wf_email_error', 'failed');
    });
  });

  describe('Error handling - stepFinalizeWorkflow fails in catch block', () => {
    it('should handle finalize failure gracefully and still throw original error', async () => {
      const mockWorkflow = { id: 'wf_double_error', status: 'running' };
      const originalError = new Error('Research failed');
      const finalizeError = new Error('Finalize failed');

      vi.mocked(steps.stepCreateWorkflow).mockResolvedValue(mockWorkflow as any);
      vi.mocked(steps.stepResearch).mockRejectedValue(originalError);
      vi.mocked(steps.stepFinalizeWorkflow).mockRejectedValue(finalizeError);

      // Should throw the original error, not the finalize error
      await expect(workflowInbound(mockLead)).rejects.toThrow('Research failed');

      // Should have attempted to finalize
      expect(steps.stepFinalizeWorkflow).toHaveBeenCalledWith('wf_double_error', 'failed');
    });
  });

  describe('Workflow step order', () => {
    it('should execute steps in correct order', async () => {
      const mockWorkflow = { id: 'wf_order', status: 'running' };
      const callOrder: string[] = [];

      vi.mocked(steps.stepCreateWorkflow).mockImplementation(async () => {
        callOrder.push('create');
        return mockWorkflow as any;
      });
      vi.mocked(steps.stepResearch).mockImplementation(async () => {
        callOrder.push('research');
        return 'Research data';
      });
      vi.mocked(steps.stepQualify).mockImplementation(async () => {
        callOrder.push('qualify');
        return { category: 'QUALIFIED', reason: 'Fit', score: 85 } as any;
      });
      vi.mocked(steps.stepSaveQualification).mockImplementation(async () => {
        callOrder.push('saveQualification');
      });
      vi.mocked(steps.stepWriteEmail).mockImplementation(async () => {
        callOrder.push('writeEmail');
        return 'Email draft';
      });
      vi.mocked(steps.stepSaveWorkflowData).mockImplementation(async () => {
        callOrder.push('saveWorkflowData');
      });
      vi.mocked(steps.stepHumanFeedback).mockImplementation(async () => {
        callOrder.push('humanFeedback');
        return undefined;
      });
      vi.mocked(steps.stepFinalizeWorkflow).mockImplementation(async () => {
        callOrder.push('finalize');
      });

      await workflowInbound(mockLead);

      expect(callOrder).toEqual([
        'create',
        'research',
        'qualify',
        'saveQualification',
        'writeEmail',
        'saveWorkflowData',
        'humanFeedback',
        'finalize',
      ]);
    });
  });

  describe('Tenant context handling', () => {
    it('should handle LeadWithTenant type', async () => {
      const leadWithTenant = {
        ...mockLead,
        tenantId: 'tenant_123',
        tenantSettings: {
          enableAiResearch: true,
          qualificationThreshold: 70,
        },
      };

      const mockWorkflow = { id: 'wf_tenant', status: 'running' };

      vi.mocked(steps.stepCreateWorkflow).mockResolvedValue(mockWorkflow as any);
      vi.mocked(steps.stepResearch).mockResolvedValue('Research data');
      vi.mocked(steps.stepQualify).mockResolvedValue({
        category: 'UNQUALIFIED',
        reason: 'Low score',
        score: 30,
      } as any);
      vi.mocked(steps.stepSaveQualification).mockResolvedValue(undefined);
      vi.mocked(steps.stepFinalizeWorkflow).mockResolvedValue(undefined);

      await workflowInbound(leadWithTenant);

      expect(steps.stepCreateWorkflow).toHaveBeenCalledWith(leadWithTenant);
    });
  });
});
