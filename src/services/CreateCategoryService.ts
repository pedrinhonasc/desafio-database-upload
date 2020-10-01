import { getCustomRepository } from 'typeorm';
import CategoriesRepository from '../repositories/CategoriesRepository';
import Category from '../models/Category';

interface Request {
  title: string;
}

class CreateCategoryService {
  public async execute({ title }: Request): Promise<Category> {
    const categoriesRepository = getCustomRepository(CategoriesRepository);

    const existCategory = await categoriesRepository.findByTitle(title);

    if (existCategory) {
      return existCategory;
    }

    const category = categoriesRepository.create({
      title,
    });

    await categoriesRepository.save(category);

    return category;
  }
}

export default CreateCategoryService;
