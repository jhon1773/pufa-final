import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as path from 'path';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { CatalogosModule } from './modules/catalogos/catalogos.module';
import { RegistroModule } from './modules/registro/registro.module';
import { PerfilesModule } from './modules/perfiles/perfiles.module';
import { ProyectosModule } from './modules/proyectos/proyectos.module';
import { TramitesModule } from './modules/tramites/tramites.module';
import { DocumentosModule } from './modules/documentos/documentos.module';
import { PagosModule } from './modules/pagos/pagos.module';
import { EntidadesModule } from './modules/entidades/entidades.module';

@Module({
  imports: [
    // Configuración global con variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [path.resolve(process.cwd(), '.env')],
      load: [appConfig, databaseConfig],
    }),
    // Conexión a PostgreSQL con TypeORM
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        autoLoadEntities: true,
        synchronize: configService.get('database.synchronize'),
        logging: configService.get('database.logging'),
        retryAttempts: 1,
        retryDelay: 0,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsuariosModule,
    CatalogosModule,
    RegistroModule,
    PerfilesModule,
    ProyectosModule,
    TramitesModule,
    DocumentosModule,
    PagosModule,
    EntidadesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
