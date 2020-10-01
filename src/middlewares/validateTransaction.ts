import { Request, Response, NextFunction } from 'express';
import { getCustomRepository } from 'typeorm';
import TransactionsRepository from '../repositories/TransactionsRepository';
import AppError from '../errors/AppError';

const validateTransaction = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  const { value, type } = request.body;

  const transactionsRepository = getCustomRepository(TransactionsRepository);

  const balance = await transactionsRepository.getBalance();

  if (type === 'outcome' && balance.total - value < 0)
    throw new AppError('Invalid balance');

  return next();
};

export default validateTransaction;
