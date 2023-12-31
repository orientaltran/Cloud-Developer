import * as uuid from 'uuid'
import { TodosAccess } from "../dataLayer/todosAccess.mjs";
import { createLogger } from '../utils/logger.mjs'
import { AttachmentUtils } from "../fileStorage/attachmentUtils.mjs";

// TODO: Implement businessLogic
const logger = createLogger("Todos");
const todosAccess = new TodosAccess();
const attachmentUtils = new AttachmentUtils();

// Get all todos by userId
export async function getTodosForUser(userId) {
    logger.info("Call function getall todos");
    return await todosAccess.getAll(userId);
}

// Create todo
export async function createTodo(createTodoRequest, userId) {
    logger.info("Call function create todo");

    const todoId = uuid.v4()
    const createdAt = new Date().toISOString();
    const s3AttachUrl = attachmentUtils.getAttachmentUrl(todoId);
    const todoItem = {
        todoId: todoId,
        userId: userId,
        createdAt,
        done: false,
        attachmentUrl: s3AttachUrl,
        name: createTodoRequest.name,
        dueDate: createTodoRequest.dueDate
    }

    return await todosAccess.createTodo(todoItem);
}

// Update todo
export async function updateTodo(userId, todoId, updateToDoRequest) {
    logger.info("Call function update todo");

    return await todosAccess.updateTodo(userId, todoId, updateToDoRequest);
}

// Delete todo
export async function deleteTodo(userId, todoId) {
    logger.info("Call function delete todo");

    return await todosAccess.deteteTodo(userId, todoId);
}

// General updateAttachmentPresignedUrl
export async function updateAttachmentPresignedUrl(userId, todoId) {
    logger.info("Call function updateAttachmentPresignedUrl");

    return await todosAccess.updateAttachmentPresignedUrl(userId, todoId);
}
