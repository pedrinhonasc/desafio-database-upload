import csvParser from 'csv-parse';
import fs from 'fs';
import { getCustomRepository, In } from 'typeorm';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import CategoriesRepository from '../repositories/CategoriesRepository';
import Category from '../models/Category';

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const categoriesRepository = getCustomRepository(CategoriesRepository);
    const readCSVStream = fs.createReadStream(filePath);

    const parseStream = csvParser({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const transactions: {
      title: string;
      type: 'income' | 'outcome';
      value: number;
      category: string;
    }[] = [];
    const categories: string[] = [];

    parseCSV.on('data', async line => {
      categories.push(line[3]);
      transactions.push({
        title: line[0],
        type: line[1],
        value: line[2],
        category: line[3],
      });
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    const foundCategories = await categoriesRepository.find({
      where: {
        title: In(categories),
      },
    });

    const foundCategoriesTitles = foundCategories.map(
      (category: Category) => category.title,
    );

    const categoriesToBeCreated = categories
      .filter(category => !foundCategoriesTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoriesRepository.create(
      categoriesToBeCreated.map(title => ({ title })),
    );

    await categoriesRepository.save(newCategories);

    const allCategories = [...newCategories, ...foundCategories];

    const newTransactions = transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: allCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionsRepository.save(newTransactions);

    await fs.promises.unlink(filePath);

    return newTransactions;
  }
}

export default ImportTransactionsService;
