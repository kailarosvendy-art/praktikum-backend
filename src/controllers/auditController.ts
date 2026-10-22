import type { Request, Response } from 'express';
import type { CreateAuditInput } from '../repositories/auditRepository.ts';
import { AuditService } from '../services/auditService.ts';
import { getAuthenticatedUser } from '../middlewares/authenticate.ts';
import type { AuthUser } from '../services/tokenService.ts';

type AuditRequestInput = Omit<CreateAuditInput, 'metadata' | 'userId'> & {
  metadata?: string | Record<string, unknown> | null;
};

const isPositiveInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0;

const isCreateAuditInput = (body: unknown): body is AuditRequestInput => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false;
  const input = body as Record<string, unknown>;
  const metadataIsValid =
    input.metadata === undefined ||
    input.metadata === null ||
    typeof input.metadata === 'string' ||
    (typeof input.metadata === 'object' && !Array.isArray(input.metadata));
  return (
    Object.keys(input).every((key) =>
      ['action', 'targetTable', 'targetId', 'metadata'].includes(key),
    ) &&
    typeof input.action === 'string' &&
    input.action.trim().length > 0 &&
    input.action.trim().length <= 50 &&
    typeof input.targetTable === 'string' &&
    input.targetTable.trim().length > 0 &&
    input.targetTable.trim().length <= 50 &&
    isPositiveInteger(input.targetId) &&
    metadataIsValid
  );
};

export class AuditController {
  private auditService: AuditService;

  constructor(auditService: AuditService = new AuditService()) {
    this.auditService = auditService;
  }

  private handleError(res: Response, error: unknown): Response {
    if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
      return res.status(404).json({ status: 'fail', message: 'Data pengguna tidak ditemukan' });
    }
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server',
      error: error instanceof Error ? error.message : String(error),
    });
  }

  getAuditLogs = async (_req: Request, res: Response): Promise<Response> => {
    try {
      const auditLogs = await this.auditService.getAllAuditLogs();
      return res.status(200).json({ status: 'success', data: auditLogs });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  createAuditLog = async (req: Request, res: Response): Promise<Response> => {
    if (!isCreateAuditInput(req.body)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Body harus berisi action, targetTable, targetId, dan metadata opsional yang valid; userId diambil dari token',
      });
    }
    try {
      const user = getAuthenticatedUser<AuthUser>(res);
      const input = {
        userId: user.id,
        action: req.body.action.trim(),
        targetTable: req.body.targetTable.trim(),
        targetId: req.body.targetId,
        metadata:
          req.body.metadata === undefined || req.body.metadata === null
            ? req.body.metadata
            : typeof req.body.metadata === 'string'
              ? req.body.metadata
              : JSON.stringify(req.body.metadata),
      };
      const audit = await this.auditService.createAuditLog(input);
      return res.status(201).json({ status: 'success', data: audit });
    } catch (error) {
      return this.handleError(res, error);
    }
  };
}