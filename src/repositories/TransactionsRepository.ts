import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions = await this.find();

    const balance = transactions.reduce(
      (acc, current): Balance => {
        if (current.type === 'income') {
          return {
            income: current.value + acc.income,
            outcome: acc.outcome,
            total: acc.total + current.value,
          };
        }
        if (current.type === 'outcome') {
          return {
            income: acc.income,
            outcome: current.value + acc.outcome,
            total: acc.total - current.value,
          };
        }
        return acc;
      },
      {
        income: 0,
        outcome: 0,
        total: 0,
      },
    );

    return balance;
  }
}

export default TransactionsRepository;
