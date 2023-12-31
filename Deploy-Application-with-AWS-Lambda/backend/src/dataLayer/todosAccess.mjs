import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import { createLogger } from '../utils/logger.mjs'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// TODO: Implement dataLayer
const logger = createLogger("TodoAccess");
const url_expiration = process.env.SIGNED_URL_EXPIRATION;

export class TodosAccess {
    constructor(
        dynamoDbClient = DynamoDBDocument.from(new DynamoDB()),
        S3 = new S3Client(),
        todosTable = process.env.TODOS_TABLE,
        todosIndex = process.env.TODOS_CREATED_AT_INDEX,
        s3_bucket_name = process.env.ATTACHMENT_S3_BUCKET
    ) {
        this.dynamoDbClient = dynamoDbClient
        this.S3 = S3
        this.todosTable = todosTable
        this.todosIndex = todosIndex
        this.bucket_name = s3_bucket_name
    }

    // Get all todo
    async getAll(userId) {
        logger.info("Call function getAll");

        const result = await this.dynamoDbClient.query({
            TableName: this.todosTable,
            IndexName: this.todosIndex,
            KeyConditionExpression: "userId = :userId",
            ExpressionAttributeValues: {
                ":userId": userId
            }
        })

        return result.Items
    }

    // Create toDo
    async createTodo(todo) {
        logger.info("Call function createTodo");

        try {
            await this.dynamoDbClient.put({
                TableName: this.todosTable,
                Item: todo,
            })

            return todo
        } catch (e) {
            return "Create Error: " + e.message
        }
    }

    // update Todo
    async updateTodo(userId, todoId, updateToDoRequest) {
        logger.info("Call function updateTodo");

        try {
            await this.dynamoDbClient.update({
                TableName: this.todosTable,
                Key: {
                    userId,
                    todoId,
                },
                UpdateExpression:
                    "set #name = :name, #dueDate = :dueDate, #done = :done",
                ExpressionAttributeNames: {
                    "#name": "name",
                    "#dueDate": "dueDate",
                    "#done": "done",
                },
                ExpressionAttributeValues: {
                    ":name": updateToDoRequest.name,
                    ":dueDate": updateToDoRequest.dueDate,
                    ":done": updateToDoRequest.done,
                },
                ReturnValues: "UPDATED_NEW",
            })

            return "Update success."
        } catch (e) {
            return "Update Error: " + e.message
        }
    }

    // Delete Todo
    async deteteTodo(userId, todoId) {
        logger.info("Call function deleteTodo");

        try {
            await this.dynamoDbClient.delete({
                TableName: this.todosTable,
                Key: {
                    userId,
                    todoId,
                },
            })

            return "Delete success"
        } catch (e) {
            return "Delete Error: " + e.message
        }
    }

    // Update updateAttachmentPresignedUrl
    async updateAttachmentPresignedUrl(userId, todoId) {
        logger.info("Call function updateAttachmentPresignedUrl");

        try {

            const command = new PutObjectCommand({
                Bucket: this.bucket_name,
                Key: todoId
            })

            const url = await getSignedUrl(this.S3, command, {
                expiresIn: parseInt(url_expiration)
            })

            await this.dynamoDbClient
                .update({
                    TableName: this.todosTable,
                    Key: {
                        userId,
                        todoId,
                    },
                    UpdateExpression: "set attachmentUrl = :URL",
                    ExpressionAttributeValues: {
                        ":URL": url.split("?")[0],
                    },
                    ReturnValues: "UPDATED_NEW",
                })

            return url

        } catch (e) {
            return "Error: " + e.message
        }
    }
}
