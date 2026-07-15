import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  @Post('token')
  @ApiOperation({ summary: 'Generate an access token for a project (mock)' })
  @ApiResponse({
    status: 201,
    description: 'Mock token generated successfully',
    schema: {
      example: {
        projectId: 'project-backend',
        token: 'MOCK-TOKEN-1234567890',
        expiresIn: '30d',
      },
    },
  })
  generateToken(@Body() body: { projectId: string }) {
    return {
      projectId: body.projectId ?? 'unknown-project',
      token: 'MOCK-TOKEN-1234567890',
      expiresIn: '30d',
    };
  }
}
