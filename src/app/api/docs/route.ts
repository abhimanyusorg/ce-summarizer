import { NextResponse } from 'next/server';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerConfig from '../../../../swagger';

/**
 * @swagger
 * /api/docs:
 *   get:
 *     summary: Get OpenAPI specification
 *     description: Returns the OpenAPI 3.0 specification for the CE Summarization API.
 *     responses:
 *       200:
 *         description: OpenAPI specification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: OpenAPI 3.0 specification object
 */
export async function GET() {
  const specs = swaggerJSDoc(swaggerConfig);
  return NextResponse.json(specs);
}