import _ from 'lodash';
import { isValidObjectId } from 'mongoose';
import { BadRequestError } from '../helpers/errorHandler.js';

export default class ValidatorMiddleware {
	static validateRequest = (validator) => {
		return async (req, res, next) => {
            try {
                const { error, value } = await validator(req);
                if (error) {
                    const errorMessage = error.details[0].message;
                    throw new BadRequestError(errorMessage);
                }
                req.body = value;
                next();
            } catch (error) {
                return res.status(error.status).json({message: error.message}); // Handle the rejected promise here
            }
		};
	};
	
	// This middleware is for validating request that has some special condition or uses one method to handle multiple requests
	static validateRequestActivity = (activityType, validator) => {
		return async (req, res, next) => {
            try {
				req.body.activity = activityType;
                const { error, value } = await validator(req);
                if (error) {
                    const errorMessage = error.details[0].message;
                    throw new BadRequestError(errorMessage);
                }
                req.body = value;
                next();
            } catch (error) {
                return res.status(error.status).json({message: error.message}); // Handle the rejected promise here
            }
		};
	};

	static validateObjectIds = (idNames) => {
		return (req, res, next) => {
			try {
				idNames = Array.isArray(idNames) ? idNames : [idNames];
				const invalidId = _.find(idNames, (idName) => !isValidObjectId(req.params[idName]));
				next();
			} catch (error) {
				next(error);
			}
		};
	};

	static validateQueryObjectIds = (idNames) => {
		return (req, res, next) => {
			try {
				idNames = Array.isArray(idNames) ? idNames : [idNames];
				const invalidId = _.find(idNames, (idName) => !isValidObjectId(req.query[idName]));
				if (invalidId) throw new BadRequestError(`Invalid ${invalidId} passed`);

				next();
			} catch (error) {
				next(error);
			}
		};
	};
}