import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: { title: 'Review Kantin API', version: '1.0.0' },
  servers: [{ url: 'http://localhost:3000' }],
  securityDefinitions: {
    bearerAuth: {
      type: 'apiKey',
      name: 'Authorization',
      in: 'header',
      description: 'Masukkan token dengan format: Bearer <token>',
    },
  },
  definitions: {
    AuditInput: {
      $action: 'UPDATE',
      $targetTable: 'REVIEWS',
      $targetId: 7,
      metadata: { field: 'status', value: 'resolved' },
    },
    FlagStatusUpdate: {
      $status: 'resolved',
    },
    LikeInput: {
      $reviewId: 1,
    },
    MenuItemInput: {
      $stallId: 1,
      $name: 'Nasi Goreng Spesial',
      $price: 18000,
      isAvailable: true,
    },
    MenuItemUpdate: {
      stallId: 1,
      name: 'Nasi Goreng Spesial',
      price: 18000,
      isAvailable: true,
    },
    UserInput: {
      $name: 'Budi Santoso',
      $email: 'budi@example.com',
      $password: 'password123',
    },
    RegisterInput: {
      $name: 'Budi Santoso',
      $email: 'budi@example.com',
      $password: 'password123',
    },
    LoginInput: {
      $email: 'budi@example.com',
      $password: 'password123',
    },
    AuthUser: {
      $id: 1,
      $name: 'Budi Santoso',
      $email: 'budi@example.com',
      $role: 'customer',
    },
    RegisterResponse: {
      $status: 'success',
      $data: {
        user: { id: 1, name: 'Budi Santoso', email: 'budi@example.com', role: 'customer' },
      },
    },
    LoginResponse: {
      $token: 'jwt-token-example',
      $tokenType: 'Bearer',
      $expiresIn: '2h',
      $user: { id: 1, name: 'Budi Santoso', email: 'budi@example.com', role: 'customer' },
    },
    AuthMeResponse: {
      $status: 'success',
      $data: { id: 1, name: 'Budi Santoso', email: 'budi@example.com', role: 'customer' },
    },
    StallInput: {
      $name: 'Warung Baru',
      category: 'Nasi',
      location: 'Kantin FK',
      description: 'Deskripsi warung',
    },
    StallReviewInput: {
      $rating: 5,
      comment: 'Makanannya enak',
    },
    StallUpdate: {
      name: 'Warung Baru',
      category: 'Nasi',
      location: 'Kantin FK',
      description: 'Deskripsi warung',
    },
    ValidationError: {
      $status: 'fail',
      $message: 'Validasi gagal',
      $errors: [{ $field: 'page', $message: 'page minimal 1' }],
    },
  },
};

const outputFile = './src/docs/swagger-output.json';
const endpointsFiles = ['./src/index.ts'];

swaggerAutogen()(outputFile, endpointsFiles, doc);
