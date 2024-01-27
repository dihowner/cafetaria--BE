export async function paginate(collectionObject, options = {}) {
    const { page = 1, limit = 10, sortBy = '_id', sortOrder = 'asc' } = options;
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    const skip = (page - 1) * limit;
    const count = collectionObject.length;
    const totalPages = Math.ceil(count / limit);
    const paginatedResults = collectionObject
                            .sort((a, b) => (sortOrder === 'desc' ? b[sortBy] - a[sortBy] : a[sortBy] - b[sortBy]))
                            .slice(skip, skip + limit);

    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      data: paginatedResults,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: page,
        hasNextPage,
        hasPrevPage,
      },
    };
}