class APIFeatures {
    constructor(query, queryStr) {
        this.query = query;
        this.queryStr = queryStr;
    }

    search() {
        let keyword = this.queryStr.keyword ? {
            name: {
                $regex: this.queryStr.keyword,
                $options: 'i'
            }
        } : {};
        this.query.find({ ...keyword });
        return this;
    }

    filter() {
        const queryStrCopy = { ...this.queryStr };
        const removeFields = ['keyword', 'limit', 'page'];
        removeFields.forEach(field => delete queryStrCopy[field]);

        // Add brand filtering
        if (queryStrCopy.brands) {
            queryStrCopy.brand = { $in: queryStrCopy.brands.split(',') }; // Assuming brands are sent as a comma-separated string
            delete queryStrCopy.brands; // Remove the brands field for further processing
        }

        let queryStr = JSON.stringify(queryStrCopy);
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte)/g, match => `$${match}`);
        console.log(queryStr);
        this.query.find(JSON.parse(queryStr));
        return this;
    }

    paginate(resultPerPage) {
        const currentPage = Number(this.queryStr.page) || 1;
        const skip = resultPerPage * (currentPage - 1);
        this.query.limit(resultPerPage).skip(skip);
        return this;
    }
}

module.exports = APIFeatures;
