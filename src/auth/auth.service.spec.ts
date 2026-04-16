import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;

  let usersService: {
    findByName: jest.Mock;
    create: jest.Mock;
  };

  let jwtService: {
    sign: jest.Mock;
  };

  beforeEach(async () => {
    usersService = {
      findByName: jest.fn(),
      create: jest.fn(),
    };

    jwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      name: 'TestUser',
      password: 'password123',
    };

    it('should register a new user successfully', async () => {
      usersService.findByName.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      usersService.create.mockResolvedValue({
        id: 1,
        name: 'TestUser',
        password: 'hashed-password',
      });

      const result = await service.register(registerDto);

      expect(usersService.findByName).toHaveBeenCalledWith('TestUser');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(usersService.create).toHaveBeenCalledWith({
        name: 'TestUser',
        password: 'hashed-password',
      });
      expect(result).toEqual({
        id: 1,
        name: 'TestUser',
      });
      expect(result).not.toHaveProperty('password');
    });

    it('should throw ConflictException when username already exists', async () => {
      usersService.findByName.mockResolvedValue({
        id: 1,
        name: 'TestUser',
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(usersService.findByName).toHaveBeenCalledWith('TestUser');
      expect(usersService.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto = {
      name: 'TestUser',
      password: 'password123',
    };

    it('should return access_token for valid credentials', async () => {
      usersService.findByName.mockResolvedValue({
        id: 1,
        name: 'TestUser',
        password: 'hashed-password',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue('jwt-token-here');

      const result = await service.login(loginDto);

      expect(usersService.findByName).toHaveBeenCalledWith('TestUser');
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        'hashed-password',
      );
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 1,
        name: 'TestUser',
      });
      expect(result).toEqual({ access_token: 'jwt-token-here' });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      usersService.findByName.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(usersService.findByName).toHaveBeenCalledWith('TestUser');
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      usersService.findByName.mockResolvedValue({
        id: 1,
        name: 'TestUser',
        password: 'hashed-password',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        'hashed-password',
      );
      expect(jwtService.sign).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should return success message', () => {
      const result = service.logout();
      expect(result).toEqual({ message: 'Logged out successfully' });
    });
  });
});
