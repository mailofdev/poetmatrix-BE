import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getStatus() {
    return { name: 'PoetMatrix API', status: 'ok' };
  }
}
