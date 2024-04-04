import {
  EntityManifest,
  PropertyManifest,
  RelationshipManifest
} from '@manifest-yml/types'
import { Injectable } from '@nestjs/common'
import {
  EntitySchema,
  EntitySchemaColumnOptions,
  EntitySchemaRelationOptions
} from 'typeorm'
import { ManifestService } from '../../../manifest/services/manifest/manifest.service'
import { AdminEntitySchema } from '../../core-entities/AdminEntitySchema'
import { baseEntity } from '../../core-entities/base-entity'
import { propTypeColumnTypes } from '../../records/prop-type-column-types'

@Injectable()
export class EntityLoaderService {
  constructor(private manifestService: ManifestService) {}

  /**
   * Load entities from YML file and convert into TypeORM entities.
   *
   * @returns EntitySchema[] the entities
   *
   **/
  loadEntities(): EntitySchema[] {
    const entityManifests: EntityManifest[] =
      this.manifestService.getEntityManifests()

    // Add core entities.
    const entitySchemas: EntitySchema[] = [AdminEntitySchema]

    // Convert Manifest Entities to TypeORM Entities.
    entitySchemas.push(
      ...entityManifests.map((entityManifest: EntityManifest) => {
        const entitySchema: EntitySchema = new EntitySchema({
          name: entityManifest.className,

          // Convert properties to columns.
          columns: entityManifest.properties.reduce(
            (
              acc: { [key: string]: EntitySchemaColumnOptions },
              propManifest: PropertyManifest
            ) => {
              acc[propManifest.name] = {
                name: propManifest.name,
                type: propTypeColumnTypes[propManifest.type],
                nullable: true // Everything is nullable yet.
              }

              return acc
            },
            // Merge with baseEntity for base columns like id, createdAt, updatedAt.
            { ...baseEntity }
          ) as { [key: string]: EntitySchemaColumnOptions },

          // Convert belongsTo relationships to many-to-one relations.
          relations: entityManifest.belongsTo.reduce(
            (
              acc: { [key: string]: EntitySchemaRelationOptions },
              belongsToRelationShip: RelationshipManifest
            ) => {
              acc[belongsToRelationShip.name] = {
                target: belongsToRelationShip.entity,
                type: 'many-to-one',
                eager: !!belongsToRelationShip.eager
              }

              return acc
            },
            {}
          )
        })

        return entitySchema
      })
    )

    return entitySchemas
  }
}
